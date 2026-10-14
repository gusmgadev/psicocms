-- 004_rpc_functions.sql
-- Funciones RPC: get_available_slots, create_public_booking, is_setup_completed, verify_login_phone

-- ============================================================
-- get_available_slots(modality, date_from, date_to)
-- Devuelve huecos libres sin exponer datos de pacientes
-- Aplica: duración de sesión, descanso entre sesiones, vacaciones, modo vacaciones
-- ============================================================
CREATE OR REPLACE FUNCTION get_available_slots(
    p_modality text,
    p_date_from date,
    p_date_to date
)
RETURNS TABLE (
    slot_date date,
    slot_start time,
    slot_end time,
    available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_duration integer;
    v_break_duration integer;
    v_break_enabled boolean;
    v_vacation_mode boolean;
    v_professional_id uuid;
    v_current_date date;
    v_slot_start time;
    v_slot_end time;
    v_day_of_week integer;
    v_slot_duration interval;
    r record;
BEGIN
    -- Validar modalidad
    IF p_modality NOT IN ('online', 'inperson') THEN
        RAISE EXCEPTION 'Modalidad inválida. Use "online" o "inperson"';
    END IF;

    -- Obtener configuración de la profesional
    SELECT
        id,
        session_duration_online,
        session_duration_inperson,
        break_between_sessions_online,
        break_between_sessions_inperson,
        break_enabled_online,
        break_enabled_inperson,
        setup_completed
    INTO
        v_professional_id,
        v_session_duration,
        v_session_duration, -- temporal, se corrige abajo
        v_break_duration,
        v_break_duration,
        v_break_enabled,
        v_break_enabled,
        v_vacation_mode
    FROM professional_profile
    WHERE is_active = true
    LIMIT 1;

    IF v_professional_id IS NULL THEN
        RETURN;
    END IF;

    -- Asignar valores correctos según modalidad
    IF p_modality = 'online' THEN
        v_session_duration := (SELECT session_duration_online FROM professional_profile WHERE is_active = true LIMIT 1);
        v_break_duration := (SELECT break_between_sessions_online FROM professional_profile WHERE is_active = true LIMIT 1);
        v_break_enabled := (SELECT break_enabled_online FROM professional_profile WHERE is_active = true LIMIT 1);
    ELSE
        v_session_duration := (SELECT session_duration_inperson FROM professional_profile WHERE is_active = true LIMIT 1);
        v_break_duration := (SELECT break_between_sessions_inperson FROM professional_profile WHERE is_active = true LIMIT 1);
        v_break_enabled := (SELECT break_enabled_inperson FROM professional_profile WHERE is_active = true LIMIT 1);
    END IF;

    v_vacation_mode := (SELECT vacation_mode FROM site_settings WHERE id = true);
    v_slot_duration := (v_session_duration + CASE WHEN v_break_enabled THEN v_break_duration ELSE 0 END) * interval '1 minute';

    -- Verificar modo vacaciones global
    IF v_vacation_mode THEN
        RETURN;
    END IF;

    -- Iterar días en el rango
    v_current_date := p_date_from;
    WHILE v_current_date <= p_date_to LOOP
        -- Saltar si está en periodo de vacaciones
        IF EXISTS (
            SELECT 1 FROM vacation_periods
            WHERE start_date <= v_current_date
            AND end_date >= v_current_date
        ) THEN
            v_current_date := v_current_date + interval '1 day';
            CONTINUE;
        END IF;

        v_day_of_week := EXTRACT(DOW FROM v_current_date)::integer;

        -- Obtener slots de disponibilidad para este día y modalidad
        FOR r IN
            SELECT start_time, end_time
            FROM availability_slots
            WHERE modality = p_modality
            AND day_of_week = v_day_of_week
            AND is_active = true
            ORDER BY start_time
        LOOP
            v_slot_start := r.start_time;
            v_slot_end := r.end_time;

            -- Generar huecos dentro del rango de disponibilidad
            WHILE v_slot_start + v_slot_duration <= v_slot_end LOOP
                DECLARE
                    v_slot_starts_at timestamptz := v_current_date + v_slot_start;
                    v_slot_ends_at timestamptz := v_current_date + v_slot_start + v_slot_duration;
                    v_is_booked boolean;
                BEGIN
                    -- Verificar si ya hay cita en este hueco
                    SELECT EXISTS (
                        SELECT 1 FROM appointments
                        WHERE modality = p_modality
                        AND status IN ('scheduled', 'completed')
                        AND starts_at < v_slot_ends_at
                        AND ends_at > v_slot_starts_at
                    ) INTO v_is_booked;

                    RETURN QUERY SELECT
                        v_current_date,
                        v_slot_start,
                        (v_slot_start + v_slot_duration)::time,
                        NOT v_is_booked;
                END;

                v_slot_start := v_slot_start + v_slot_duration;
            END LOOP;
        END LOOP;

        v_current_date := v_current_date + interval '1 day';
    END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_available_slots(text, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_available_slots(text, date, date) FROM anon;
GRANT EXECUTE ON FUNCTION get_available_slots(text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(text, date, date) TO service_role;

-- ============================================================
-- create_public_booking(...)
-- Valida todo en servidor, normaliza teléfono, reutiliza/crea paciente, crea cita
-- SOLO executable por service_role
-- ============================================================
CREATE OR REPLACE FUNCTION create_public_booking(
    p_patient_name text,
    p_patient_phone text,
    p_patient_email text,
    p_reason text,
    p_modality text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_consent_version text,
    p_honeypot text DEFAULT ''
)
RETURNS TABLE (
    appointment_id uuid,
    patient_id uuid,
    patient_number text,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone text;
    v_existing_patient_id uuid;
    v_existing_patient_name text;
    v_new_patient_id uuid;
    v_patient_number text;
    v_session_duration integer;
    v_break_duration integer;
    v_break_enabled boolean;
    v_slot_duration interval;
    v_vacation_mode boolean;
    v_max_future_appointments integer := 3;
    v_future_appointments_count integer;
BEGIN
    -- Validar honeypot (campo trampa anti-bot)
    IF p_honeypot IS NOT NULL AND p_honeypot <> '' THEN
        RAISE EXCEPTION 'Solicitud inválida';
    END IF;

    -- Validar modalidad
    IF p_modality NOT IN ('online', 'inperson') THEN
        RAISE EXCEPTION 'Modalidad inválida';
    END IF;

    -- Validar fechas
    IF p_starts_at >= p_ends_at THEN
        RAISE EXCEPTION 'Rango de fechas inválido';
    END IF;

    IF p_starts_at < now() THEN
        RAISE EXCEPTION 'No se pueden reservar citas en el pasado';
    END IF;

    -- Validar longitud nombre
    IF length(trim(p_patient_name)) < 2 OR length(trim(p_patient_name)) > 100 THEN
        RAISE EXCEPTION 'Nombre inválido';
    END IF;

    -- Validar longitud motivo
    IF p_reason IS NOT NULL AND length(p_reason) > 500 THEN
        RAISE EXCEPTION 'Motivo demasiado largo';
    END IF;

    -- Normalizar teléfono (solo dígitos)
    v_clean_phone := regexp_replace(p_patient_phone, '\D', '', 'g');
    IF v_clean_phone !~ '^[0-9]{6,15}$' THEN
        RAISE EXCEPTION 'Teléfono inválido';
    END IF;

    -- Verificar modo vacaciones
    SELECT vacation_mode INTO v_vacation_mode FROM site_settings WHERE id = true;
    IF v_vacation_mode THEN
        RAISE EXCEPTION 'No hay disponibilidad en este momento';
    END IF;

    -- Verificar periodo de vacaciones
    IF EXISTS (
        SELECT 1 FROM vacation_periods
        WHERE start_date <= p_starts_at::date
        AND end_date >= p_starts_at::date
    ) THEN
        RAISE EXCEPTION 'No hay disponibilidad en este momento';
    END IF;

    -- Obtener configuración de duración y descanso
    IF p_modality = 'online' THEN
        SELECT session_duration_online, break_between_sessions_online, break_enabled_online
        INTO v_session_duration, v_break_duration, v_break_enabled
        FROM professional_profile WHERE is_active = true LIMIT 1;
    ELSE
        SELECT session_duration_inperson, break_between_sessions_inperson, break_enabled_inperson
        INTO v_session_duration, v_break_duration, v_break_enabled
        FROM professional_profile WHERE is_active = true LIMIT 1;
    END IF;

    v_slot_duration := (v_session_duration + CASE WHEN v_break_enabled THEN v_break_duration ELSE 0 END) * interval '1 minute';

    -- Verificar que el slot coincide con la configuración
    IF p_ends_at - p_starts_at <> v_slot_duration THEN
        RAISE EXCEPTION 'Duración de cita inválida';
    END IF;

    -- Verificar disponibilidad (revalidación)
    IF EXISTS (
        SELECT 1 FROM appointments
        WHERE modality = p_modality
        AND status IN ('scheduled', 'completed')
        AND starts_at < p_ends_at
        AND ends_at > p_starts_at
    ) THEN
        RAISE EXCEPTION 'El hueco ya no está disponible';
    END IF;

    -- Verificar límite de citas futuras activas por teléfono
    SELECT count(*) INTO v_future_appointments_count
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE p.phone = v_clean_phone
    AND a.modality = p_modality
    AND a.status IN ('scheduled', 'completed')
    AND a.starts_at > now();

    IF v_future_appointments_count >= v_max_future_appointments THEN
        RAISE EXCEPTION 'Límite de citas alcanzado';
    END IF;

    -- Buscar paciente existente por teléfono Y nombre (sin mayúsculas/acentos)
    SELECT id, full_name, patient_number
    INTO v_existing_patient_id, v_existing_patient_name, v_patient_number
    FROM patients
    WHERE phone = v_clean_phone
    AND lower(unaccent(full_name)) = lower(unaccent(trim(p_patient_name)))
    LIMIT 1;

    IF v_existing_patient_id IS NOT NULL THEN
        -- Paciente existe con mismo teléfono y nombre -> reutilizar
        v_new_patient_id := v_existing_patient_id;
    ELSE
        -- Verificar si existe el teléfono con OTRO nombre (posible duplicado)
        SELECT id INTO v_existing_patient_id
        FROM patients
        WHERE phone = v_clean_phone
        LIMIT 1;

        -- Crear nuevo paciente
        INSERT INTO patients (phone, full_name, email, consent_at, consent_version, possible_duplicate)
        VALUES (v_clean_phone, trim(p_patient_name), NULLIF(trim(p_patient_email), ''), now(), p_consent_version, v_existing_patient_id IS NOT NULL)
        RETURNING id, patient_number INTO v_new_patient_id, v_patient_number;
    END IF;

    -- Crear la cita
    INSERT INTO appointments (patient_id, modality, starts_at, ends_at, reason, origin, status)
    VALUES (v_new_patient_id, p_modality, p_starts_at, p_ends_at, NULLIF(trim(p_reason), ''), 'web', 'scheduled')
    RETURNING id INTO appointment_id;

    patient_id := v_new_patient_id;
    message := 'Cita agendada correctamente';

    RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) TO service_role;

-- ============================================================
-- is_setup_completed()
-- Accesible para anon (verifica si la instalación ya se hizo)
-- ============================================================
CREATE OR REPLACE FUNCTION is_setup_completed()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_completed boolean;
BEGIN
    SELECT setup_completed INTO v_completed
    FROM site_settings
    WHERE id = true;

    IF v_completed IS NULL THEN
        SELECT setup_completed INTO v_completed
        FROM professional_profile
        WHERE is_active = true
        LIMIT 1;
    END IF;

    RETURN COALESCE(v_completed, false);
END;
$$;

REVOKE EXECUTE ON FUNCTION is_setup_completed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_setup_completed() TO anon;
GRANT EXECUTE ON FUNCTION is_setup_completed() TO authenticated;
GRANT EXECUTE ON FUNCTION is_setup_completed() TO service_role;

-- ============================================================
-- verify_login_phone(phone)
-- Verifica que el teléfono coincida con el de la psicóloga
-- Solo executable por authenticated CON is_owner()
-- ============================================================
CREATE OR REPLACE FUNCTION verify_login_phone(p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner_phone text;
    v_clean_phone text;
BEGIN
    -- Solo permitir si is_owner() es true
    IF NOT is_owner() THEN
        RETURN false;
    END IF;

    v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

    SELECT regexp_replace(phone_public, '\D', '', 'g') INTO v_owner_phone
    FROM professional_profile
    WHERE is_active = true
    LIMIT 1;

    IF v_owner_phone IS NULL THEN
        RETURN false;
    END IF;

    RETURN v_clean_phone = v_owner_phone;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_login_phone(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION verify_login_phone(text) FROM anon;
GRANT EXECUTE ON FUNCTION verify_login_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_phone(text) TO service_role;