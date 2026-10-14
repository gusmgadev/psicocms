-- 002_constraints.sql
-- Restricciones adicionales: teléfono solo dígitos, número de ficha correlativo,
-- restricción de exclusión para solapamiento de citas

-- Restricción: patients.phone solo dígitos (sin espacios, sin símbolos)
ALTER TABLE patients
ADD CONSTRAINT patients_phone_digits_only
CHECK (phone ~ '^[0-9]+$');

-- Función para generar patient_number correlativo (P-0001, P-0002, ...)
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    max_num integer;
BEGIN
    IF NEW.patient_number IS NULL OR NEW.patient_number = '' THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(patient_number FROM 'P-(\d+)') AS integer)), 0)
        INTO max_num
        FROM patients;
        NEW.patient_number := 'P-' || LPAD((max_num + 1)::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_patient_number
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION generate_patient_number();

-- Restricción de exclusión para evitar solapamiento de citas activas
-- Requiere extensión btree_gist (ya creada en migración 001)
ALTER TABLE appointments
ADD CONSTRAINT appointments_no_overlap
EXCLUDE USING gist (
    modality WITH =,
    tsrange(starts_at, ends_at) WITH &&
) WHERE (status IN ('scheduled', 'completed'));

-- Trigger para updated_at en tablas principales
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_professional_profile_updated_at
BEFORE UPDATE ON professional_profile
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialties_updated_at
BEFORE UPDATE ON specialties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_slots_updated_at
BEFORE UPDATE ON availability_slots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacation_periods_updated_at
BEFORE UPDATE ON vacation_periods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_records_updated_at
BEFORE UPDATE ON clinical_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_protection_template_updated_at
BEFORE UPDATE ON data_protection_template
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON blog_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_phrases_updated_at
BEFORE UPDATE ON public_phrases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at
BEFORE UPDATE ON social_links
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_images_updated_at
BEFORE UPDATE ON site_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON email_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_preferences_updated_at
BEFORE UPDATE ON dashboard_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();