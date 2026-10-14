-- 004c_rate_limit.sql
-- Tabla rate_limit_events y función check_rate_limit
-- Solo executable por service_role (entorno serverless)

-- La tabla rate_limit_events ya se creó en migración 001
-- Índice ya creado: idx_rate_limit_events_identifier_type

-- Función check_rate_limit
-- Verifica si se ha superado el límite de intentos
-- p_identifier: IP, email, teléfono, etc.
-- p_event_type: 'login', 'booking', 'password_reset', etc.
-- p_max_attempts: máximo de intentos permitidos
-- p_window: ventana de tiempo (ej. '15 minutes'::interval)
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier text,
    p_event_type text,
    p_max_attempts integer,
    p_window interval
)
RETURNS TABLE (
    allowed boolean,
    attempts_used integer,
    attempts_remaining integer,
    reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cutoff timestamptz;
    v_attempts integer;
BEGIN
    v_cutoff := now() - p_window;

    -- Limpiar eventos antiguos (opcional, para mantener tabla pequeña)
    DELETE FROM rate_limit_events
    WHERE created_at < v_cutoff;

    -- Contar intentos en la ventana
    SELECT count(*) INTO v_attempts
    FROM rate_limit_events
    WHERE identifier = p_identifier
    AND event_type = p_event_type
    AND created_at >= v_cutoff;

    IF v_attempts >= p_max_attempts THEN
        RETURN QUERY SELECT
            false,
            v_attempts,
            0,
            (SELECT max(created_at) + p_window FROM rate_limit_events WHERE identifier = p_identifier AND event_type = p_event_type);
    ELSE
        -- Registrar el intento actual
        INSERT INTO rate_limit_events (identifier, event_type)
        VALUES (p_identifier, p_event_type);

        RETURN QUERY SELECT
            true,
            v_attempts + 1,
            p_max_attempts - v_attempts - 1,
            now() + p_window;
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) FROM anon;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) TO service_role;

-- RLS en rate_limit_events: solo service_role puede insertar/leer
-- (Las políticas ya se crearon en migración 003)
-- Añadir política explícita de INSERT para service_role si no existe
DROP POLICY IF EXISTS "service_role_insert_rate_limit_events" ON rate_limit_events;
CREATE POLICY "service_role_insert_rate_limit_events" ON rate_limit_events
FOR INSERT TO service_role
WITH CHECK (true);