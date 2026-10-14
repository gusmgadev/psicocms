-- 003_rls_policies.sql
-- Función is_owner() y políticas RLS
-- IMPORTANTE: is_owner() verifica que el usuario autenticado sea LA psicóloga dueña del perfil

-- Función is_owner() - SECURITY DEFINER con search_path fijado
CREATE OR REPLACE FUNCTION is_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_owner_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT user_id INTO v_owner_id
    FROM professional_profile
    WHERE is_active = true
    LIMIT 1;

    IF v_owner_id IS NULL THEN
        RETURN false;
    END IF;

    RETURN v_user_id = v_owner_id;
END;
$$;

-- Revocar ejecución a PUBLIC y anon por defecto (se concede explícitamente donde corresponda)
REVOKE EXECUTE ON FUNCTION is_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_owner() FROM anon;
GRANT EXECUTE ON FUNCTION is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION is_owner() TO service_role;

-- Habilitar RLS en todas las tablas
ALTER TABLE professional_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_protection_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS PARA ROL ANON (público - solo lectura de contenido público)
-- ============================================================

-- professional_profile: solo datos públicos
CREATE POLICY "anon_read_public_profile" ON professional_profile
FOR SELECT TO anon
USING (is_active = true);

-- site_settings: solo campos públicos
CREATE POLICY "anon_read_site_settings" ON site_settings
FOR SELECT TO anon
USING (true);

-- services: solo activos
CREATE POLICY "anon_read_services" ON services
FOR SELECT TO anon
USING (is_active = true);

-- specialties: solo activos
CREATE POLICY "anon_read_specialties" ON specialties
FOR SELECT TO anon
USING (is_active = true);

-- plans: solo activos
CREATE POLICY "anon_read_plans" ON plans
FOR SELECT TO anon
USING (is_active = true);

-- availability_slots: solo activos (para mostrar disponibilidad pública)
CREATE POLICY "anon_read_availability_slots" ON availability_slots
FOR SELECT TO anon
USING (is_active = true);

-- vacation_periods: lectura para calcular disponibilidad
CREATE POLICY "anon_read_vacation_periods" ON vacation_periods
FOR SELECT TO anon
USING (true);

-- blog_categories: solo activos
CREATE POLICY "anon_read_blog_categories" ON blog_categories
FOR SELECT TO anon
USING (is_active = true);

-- blog_posts: solo publicados
CREATE POLICY "anon_read_blog_posts" ON blog_posts
FOR SELECT TO anon
USING (status = 'published');

-- faqs: solo activos
CREATE POLICY "anon_read_faqs" ON faqs
FOR SELECT TO anon
USING (is_active = true);

-- public_phrases: todas
CREATE POLICY "anon_read_public_phrases" ON public_phrases
FOR SELECT TO anon
USING (true);

-- social_links: solo activos
CREATE POLICY "anon_read_social_links" ON social_links
FOR SELECT TO anon
USING (is_active = true);

-- site_images: todas
CREATE POLICY "anon_read_site_images" ON site_images
FOR SELECT TO anon
USING (true);

-- data_protection_template: lectura para formulario de consentimiento
CREATE POLICY "anon_read_data_protection_template" ON data_protection_template
FOR SELECT TO anon
USING (true);

-- ============================================================
-- POLÍTICAS PARA ROL AUTHENTICATED (solo cuando is_owner() = true)
-- ============================================================

-- professional_profile: dueña ve y edita todo (incluye privados)
CREATE POLICY "owner_full_access_professional_profile" ON professional_profile
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- site_settings: dueña ve y edita
CREATE POLICY "owner_full_access_site_settings" ON site_settings
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- services: dueña CRUD completo
CREATE POLICY "owner_full_access_services" ON services
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- specialties: dueña CRUD completo
CREATE POLICY "owner_full_access_specialties" ON specialties
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- plans: dueña CRUD completo
CREATE POLICY "owner_full_access_plans" ON plans
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- availability_slots: dueña CRUD completo
CREATE POLICY "owner_full_access_availability_slots" ON availability_slots
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- vacation_periods: dueña CRUD completo
CREATE POLICY "owner_full_access_vacation_periods" ON vacation_periods
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- patients: dueña CRUD completo
CREATE POLICY "owner_full_access_patients" ON patients
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- appointments: dueña CRUD completo
CREATE POLICY "owner_full_access_appointments" ON appointments
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- clinical_records: dueña CRUD completo
CREATE POLICY "owner_full_access_clinical_records" ON clinical_records
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- clinical_files: dueña CRUD completo
CREATE POLICY "owner_full_access_clinical_files" ON clinical_files
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- data_protection_template: dueña CRUD completo
CREATE POLICY "owner_full_access_data_protection_template" ON data_protection_template
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- blog_categories: dueña CRUD completo
CREATE POLICY "owner_full_access_blog_categories" ON blog_categories
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- blog_posts: dueña CRUD completo
CREATE POLICY "owner_full_access_blog_posts" ON blog_posts
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- faqs: dueña CRUD completo
CREATE POLICY "owner_full_access_faqs" ON faqs
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- public_phrases: dueña CRUD completo
CREATE POLICY "owner_full_access_public_phrases" ON public_phrases
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- social_links: dueña CRUD completo
CREATE POLICY "owner_full_access_social_links" ON social_links
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- site_images: dueña CRUD completo
CREATE POLICY "owner_full_access_site_images" ON site_images
FOR ALL TO authenticated
USING (is_owner())
WITH CHECK (is_owner());

-- email_settings: dueña puede LEER configuración (sin contraseña)
-- La contraseña solo se escribe/lee desde Server Action (service_role)
-- La interfaz muestra "contraseña guardada" sin el valor
CREATE POLICY "owner_read_email_settings" ON email_settings
FOR SELECT TO authenticated
USING (is_owner());

-- rate_limit_events: dueña puede leer (para estadísticas), solo service_role inserta
CREATE POLICY "owner_read_rate_limit_events" ON rate_limit_events
FOR SELECT TO authenticated
USING (is_owner());

-- dashboard_preferences: dueña CRUD en su fila
CREATE POLICY "owner_full_access_dashboard_preferences" ON dashboard_preferences
FOR ALL TO authenticated
USING (is_owner() AND user_id = auth.uid())
WITH CHECK (is_owner() AND user_id = auth.uid());

-- ============================================================
-- POLÍTICAS PARA SERVICE_ROLE (acceso total para Server Actions)
-- ============================================================

-- professional_profile: service_role acceso total
CREATE POLICY "service_role_full_access_professional_profile" ON professional_profile
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- site_settings
CREATE POLICY "service_role_full_access_site_settings" ON site_settings
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- services
CREATE POLICY "service_role_full_access_services" ON services
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- specialties
CREATE POLICY "service_role_full_access_specialties" ON specialties
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- plans
CREATE POLICY "service_role_full_access_plans" ON plans
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- availability_slots
CREATE POLICY "service_role_full_access_availability_slots" ON availability_slots
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- vacation_periods
CREATE POLICY "service_role_full_access_vacation_periods" ON vacation_periods
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- patients
CREATE POLICY "service_role_full_access_patients" ON patients
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- appointments
CREATE POLICY "service_role_full_access_appointments" ON appointments
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- clinical_records
CREATE POLICY "service_role_full_access_clinical_records" ON clinical_records
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- clinical_files
CREATE POLICY "service_role_full_access_clinical_files" ON clinical_files
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- data_protection_template
CREATE POLICY "service_role_full_access_data_protection_template" ON data_protection_template
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- blog_categories
CREATE POLICY "service_role_full_access_blog_categories" ON blog_categories
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- blog_posts
CREATE POLICY "service_role_full_access_blog_posts" ON blog_posts
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- faqs
CREATE POLICY "service_role_full_access_faqs" ON faqs
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- public_phrases
CREATE POLICY "service_role_full_access_public_phrases" ON public_phrases
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- social_links
CREATE POLICY "service_role_full_access_social_links" ON social_links
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- site_images
CREATE POLICY "service_role_full_access_site_images" ON site_images
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- email_settings: service_role acceso total (incluye leer/escribir contraseña)
CREATE POLICY "service_role_full_access_email_settings" ON email_settings
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- rate_limit_events: service_role CRUD completo
CREATE POLICY "service_role_full_access_rate_limit_events" ON rate_limit_events
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- dashboard_preferences
CREATE POLICY "service_role_full_access_dashboard_preferences" ON dashboard_preferences
FOR ALL TO service_role
USING (true)
WITH CHECK (true);