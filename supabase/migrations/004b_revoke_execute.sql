-- 004b_revoke_execute.sql
-- Revocar EXECUTE a PUBLIC y anon en todas las funciones RPC
-- Solo conceder a quien corresponda (service_role, authenticated, anon)

-- Funciones que SOLO service_role puede ejecutar:
REVOKE EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION create_public_booking(text, text, text, text, text, timestamptz, timestamptz, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) FROM anon;
REVOKE EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(text, text, integer, interval) TO service_role;

-- Funciones que authenticated (con is_owner) puede ejecutar:
REVOKE EXECUTE ON FUNCTION verify_login_phone(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION verify_login_phone(text) FROM anon;
GRANT EXECUTE ON FUNCTION verify_login_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_phone(text) TO service_role;

-- Funciones que anon puede ejecutar (públicas):
REVOKE EXECUTE ON FUNCTION is_setup_completed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_setup_completed() TO anon;
GRANT EXECUTE ON FUNCTION is_setup_completed() TO authenticated;
GRANT EXECUTE ON FUNCTION is_setup_completed() TO service_role;

-- Funciones que authenticated (con is_owner) y service_role pueden ejecutar:
REVOKE EXECUTE ON FUNCTION get_available_slots(text, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_available_slots(text, date, date) FROM anon;
GRANT EXECUTE ON FUNCTION get_available_slots(text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(text, date, date) TO service_role;

-- Función is_owner() - authenticated y service_role
REVOKE EXECUTE ON FUNCTION is_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_owner() FROM anon;
GRANT EXECUTE ON FUNCTION is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner() TO service_role;

-- Funciones internas (triggers, helpers) - solo service_role
REVOKE EXECUTE ON FUNCTION generate_patient_number() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION generate_patient_number() FROM anon;
REVOKE EXECUTE ON FUNCTION generate_patient_number() FROM authenticated;
GRANT EXECUTE ON FUNCTION generate_patient_number() TO service_role;

REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;