-- 008_disponibilidad_fase4.sql
-- FASE 4: zona horaria de la psicóloga y corrección de la duración de los huecos.
-- Convención: la cita dura la sesión (session_duration); el descanso SOLO separa huecos
-- (el paso entre inicios es sesión + descanso).

-- ============================================================
-- 1) Zona horaria IANA de la psicóloga (skill local-dates)
-- ============================================================
ALTER TABLE site_settings
    ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires';

-- ============================================================
-- 2) get_available_slots: ventana = sesión; avance = sesión + descanso.
--    Los instantes se convierten con la zona de la psicóloga.
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
    v_timezone text;
    v_current_date date;
    v_slot_start time;
    v_day_of_week integer;
    v_window interval;
    v_step interval;
    v_starts_at timestamptz;
    v_ends_at timestamptz;
    v_is_booked boolean;
    r record;
BEGIN
    IF p_modality NOT IN ('online', 'inperson') THEN
        RAISE EXCEPTION 'Modalidad inválida. Use "online" o "inperson"';
    END IF;

    SELECT id INTO v_professional_id
    FROM professional_profile
    WHERE is_active = true
    LIMIT 1;

    IF v_professional_id IS NULL THEN
        RETURN;
    END IF;

    IF p_modality = 'online' THEN
        SELECT session_duration_online, break_between_sessions_online, break_enabled_online
        INTO v_session_duration, v_break_duration, v_break_enabled
        FROM professional_profile WHERE is_active = true LIMIT 1;
    ELSE
        SELECT session_duration_inperson, break_between_sessions_inperson, break_enabled_inperson
        INTO v_session_duration, v_break_duration, v_break_enabled
        FROM professional_profile WHERE is_active = true LIMIT 1;
    END IF;

    SELECT vacation_mode, COALESCE(timezone, 'UTC')
    INTO v_vacation_mode, v_timezone
    FROM site_settings
    WHERE id = true;

    v_window := v_session_duration * interval '1 minute';
    v_step := (v_session_duration + CASE WHEN v_break_enabled THEN v_break_duration ELSE 0 END) * interval '1 minute';

    IF COALESCE(v_vacation_mode, false) THEN
        RETURN;
    END IF;

    -- Sin paso válido no se puede avanzar (evita bucle infinito)
    IF v_window <= interval '0' OR v_step <= interval '0' THEN
        RETURN;
    END IF;

    v_current_date := p_date_from;
    WHILE v_current_date <= p_date_to LOOP
        -- Saltar si está en periodo de vacaciones
        IF EXISTS (
            SELECT 1 FROM vacation_periods
            WHERE start_date <= v_current_date
            AND end_date >= v_current_date
        ) THEN
            v_current_date := v_current_date + 1;
            CONTINUE;
        END IF;

        v_day_of_week := EXTRACT(DOW FROM v_current_date)::integer;

        FOR r IN
            SELECT start_time, end_time
            FROM availability_slots
            WHERE modality = p_modality
            AND day_of_week = v_day_of_week
            AND is_active = true
            ORDER BY start_time
        LOOP
            v_slot_start := r.start_time;

            -- La segunda condición evita que la suma envuelva al día siguiente (24:00+)
            WHILE v_slot_start + v_window <= r.end_time
              AND v_slot_start + v_window >= v_slot_start LOOP
                v_starts_at := (v_current_date + v_slot_start) AT TIME ZONE v_timezone;
                v_ends_at := (v_current_date + v_slot_start + v_window) AT TIME ZONE v_timezone;

                SELECT EXISTS (
                    SELECT 1 FROM appointments a
                    WHERE a.modality = p_modality
                    AND a.status IN ('scheduled', 'completed')
                    AND a.starts_at < v_ends_at
                    AND a.ends_at > v_starts_at
                ) INTO v_is_booked;

                RETURN QUERY SELECT
                    v_current_date,
                    v_slot_start,
                    (v_slot_start + v_window)::time,
                    NOT v_is_booked;

                v_slot_start := v_slot_start + v_step;
            END LOOP;
        END LOOP;

        v_current_date := v_current_date + 1;
    END LOOP;
END;
$$;

-- (los permisos de la función no cambian: CREATE OR REPLACE los conserva)

-- ============================================================
-- 3) create_public_booking: la cita dura la sesión (no sesión + descanso),
--    valida con la zona local de la psicóloga y comprueba que el hueco
--    encaja en la disponibilidad configurada.
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
    v_window interval;
    v_step interval;
    v_vacation_mode boolean;
    v_timezone text;
    v_local_start timestamp;
    v_local_date date;
    v_local_time time;
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
    SELECT vacation_mode, COALESCE(timezone, 'UTC')
    INTO v_vacation_mode, v_timezone
    FROM site_settings WHERE id = true;

    IF v_vacation_mode THEN
        RAISE EXCEPTION 'No hay disponibilidad en este momento';
    END IF;

    -- Fecha y hora locales de la psicóloga
    v_local_start := p_starts_at AT TIME ZONE v_timezone;
    v_local_date := v_local_start::date;
    v_local_time := v_local_start::time;

    -- Verificar periodo de vacaciones (según la fecha local)
    IF EXISTS (
        SELECT 1 FROM vacation_periods
        WHERE start_date <= v_local_date
        AND end_date >= v_local_date
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

    -- La cita dura la sesión; el descanso solo separa inicios
    v_window := v_session_duration * interval '1 minute';
    v_step := (v_session_duration + CASE WHEN v_break_enabled THEN v_break_duration ELSE 0 END) * interval '1 minute';

    IF p_ends_at - p_starts_at <> v_window THEN
        RAISE EXCEPTION 'Duración de cita inválida';
    END IF;

    -- Verificar que el inicio encaja en un hueco de la disponibilidad configurada
    IF NOT EXISTS (
        SELECT 1 FROM availability_slots s
        WHERE s.modality = p_modality
        AND s.is_active = true
        AND s.day_of_week = EXTRACT(DOW FROM v_local_date)::integer
        AND s.start_time <= v_local_time
        AND (v_local_time + v_window) <= s.end_time
        AND (v_local_time + v_window) >= v_local_time
        AND (
            EXTRACT(EPOCH FROM v_step) = 0
            OR EXTRACT(EPOCH FROM (v_local_time - s.start_time)) % EXTRACT(EPOCH FROM v_step) = 0
        )
    ) THEN
        RAISE EXCEPTION 'El horario seleccionado no está disponible';
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
        v_new_patient_id := v_existing_patient_id;
    ELSE
        -- Verificar si existe el teléfono con OTRO nombre (posible duplicado)
        SELECT id INTO v_existing_patient_id
        FROM patients
        WHERE phone = v_clean_phone
        LIMIT 1;

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

-- (los permisos de la función no cambian: CREATE OR REPLACE los conserva)
