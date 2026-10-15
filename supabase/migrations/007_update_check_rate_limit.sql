-- 007_update_check_rate_limit.sql
-- Actualizar check_rate_limit para aceptar window en segundos (más simple que interval)

DROP FUNCTION IF EXISTS check_rate_limit(text, text, integer, interval);

CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier text,
    p_event_type text,
    p_max_attempts integer,
    p_window_seconds integer
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
    v_window interval;
BEGIN
    v_window := p_window_seconds * interval '1 second';
    v_cutoff := now() - v_window;

    -- Limpiar eventos antiguos
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
            (SELECT max(created_at) + v_window FROM rate_limit_events WHERE identifier = p_identifier AND event_type = p_event_type);
    ELSE
        -- Registrar el intento actual
        INSERT INTO rate_limit_events (identifier, event_type)
        VALUES (p_identifier, p_event_type);

        RETURN QUERY SELECT
            true,
            v_attempts + 1,
            p_max_attempts - v_attempts - 1,
            now() + v_window;
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, integer) TO service_role;