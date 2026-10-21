-- 014_perfil_privado_email_settings.sql
-- FASE 15: teléfono privado para el inicio de sesión y protección de la
-- contraseña SMTP en email_settings (las columnas secretas no se pueden leer
-- desde el cliente, ni siquiera con sesión de la dueña).

-- ============================================================
-- 1) Teléfono privado de la psicóloga (dato de login, no es público)
-- ============================================================
ALTER TABLE professional_profile
ADD COLUMN IF NOT EXISTS phone_private text;

-- Formato permitido: números con espacios y símbolos habituales de teléfono
ALTER TABLE professional_profile
ADD CONSTRAINT professional_profile_phone_private_check
CHECK (
    phone_private IS NULL
    OR phone_private = ''
    OR phone_private ~ '^[0-9 +()\-\.]{5,30}$'
);

-- ============================================================
-- 2) verify_login_phone: usa el teléfono privado si existe; si no, el público
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
    IF v_clean_phone = '' THEN
        RETURN false;
    END IF;

    SELECT COALESCE(
        NULLIF(regexp_replace(COALESCE(phone_private, ''), '\D', '', 'g'), ''),
        regexp_replace(COALESCE(phone_public, ''), '\D', '', 'g')
    ) INTO v_owner_phone
    FROM professional_profile
    WHERE is_active = true
    LIMIT 1;

    IF v_owner_phone IS NULL OR v_owner_phone = '' THEN
        RETURN false;
    END IF;

    RETURN v_clean_phone = v_owner_phone;
END;
$$;

-- Los permisos se conservan con CREATE OR REPLACE, se redeclaran por seguridad
REVOKE EXECUTE ON FUNCTION verify_login_phone(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION verify_login_phone(text) FROM anon;
GRANT EXECUTE ON FUNCTION verify_login_phone(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_login_phone(text) TO service_role;

-- ============================================================
-- 3) email_settings: authenticated solo ve columnas no secretas
--    (smtp_password_encrypted solo lo lee/escrive el servidor con service_role)
-- ============================================================
REVOKE SELECT ON email_settings FROM anon;
REVOKE SELECT ON email_settings FROM authenticated;

GRANT SELECT (
    id,
    smtp_host,
    smtp_port,
    smtp_user,
    from_name,
    from_email,
    notifications_enabled,
    notify_on_booking,
    updated_at
) ON email_settings TO authenticated;

-- Escrituras solo desde Server Action con service_role (sin política RLS de escritura)
REVOKE INSERT, UPDATE, DELETE ON email_settings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON email_settings FROM authenticated;
