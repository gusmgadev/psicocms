-- 001_tables.sql
-- Tablas principales de PsicoCMS
-- Ejecutar en Supabase SQL Editor o con Supabase CLI

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Tabla: professional_profile (datos públicos y privados de la psicóloga)
CREATE TABLE professional_profile (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Datos públicos
    full_name text NOT NULL,
    slug text UNIQUE,
    tagline text,
    license_number text,
    phone_public text,
    email_public text,
    bio text,
    address text,
    location_name text,
    latitude numeric,
    longitude numeric,
    avatar_path text,
    -- Configuración de sesiones
    session_duration_online integer NOT NULL DEFAULT 50,
    session_duration_inperson integer NOT NULL DEFAULT 50,
    break_between_sessions_online integer NOT NULL DEFAULT 0,
    break_between_sessions_inperson integer NOT NULL DEFAULT 0,
    break_enabled_online boolean NOT NULL DEFAULT false,
    break_enabled_inperson boolean NOT NULL DEFAULT false,
    -- Estado
    is_active boolean NOT NULL DEFAULT true,
    setup_completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: site_settings (configuración global, una sola fila)
CREATE TABLE site_settings (
    id boolean PRIMARY KEY DEFAULT true,
    active_theme text NOT NULL DEFAULT 'base',
    layout_mode text NOT NULL DEFAULT 'multipage',
    sections_enabled jsonb NOT NULL DEFAULT '{"blog": true, "booking": true, "faq": true, "services": true, "specialties": true}'::jsonb,
    vacation_mode boolean NOT NULL DEFAULT false,
    setup_completed boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT site_settings_single_row CHECK (id = true)
);

-- Tabla: services
CREATE TABLE services (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    icon text,
    order_index integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: specialties
CREATE TABLE specialties (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    order_index integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: plans (planes y precios online/presencial)
CREATE TABLE plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    price_online numeric(10,2),
    price_inperson numeric(10,2),
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    order_index integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: availability_slots (disponibilidad semanal por modalidad)
CREATE TABLE availability_slots (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    modality text NOT NULL CHECK (modality IN ('online', 'inperson')),
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (modality, day_of_week, start_time)
);

-- Tabla: vacation_periods (periodos de vacaciones)
CREATE TABLE vacation_periods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date date NOT NULL,
    end_date date NOT NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT vacation_periods_valid_range CHECK (end_date >= start_date)
);

-- Tabla: patients (pacientes)
CREATE TABLE patients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_number text UNIQUE NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    birth_date date,
    gender text,
    address text,
    notes text,
    consent_at timestamptz,
    consent_version text,
    possible_duplicate boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: appointments (citas)
CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    modality text NOT NULL CHECK (modality IN ('online', 'inperson')),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    reason text,
    origin text NOT NULL DEFAULT 'web' CHECK (origin IN ('web', 'manual')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT appointments_valid_range CHECK (ends_at > starts_at)
);

-- Tabla: clinical_records (historias clínicas)
CREATE TABLE clinical_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    session_date timestamptz NOT NULL DEFAULT now(),
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: clinical_files (archivos de historias clínicas)
CREATE TABLE clinical_files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinical_record_id uuid NOT NULL REFERENCES clinical_records(id) ON DELETE CASCADE,
    patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: data_protection_template (plantilla protección de datos)
CREATE TABLE data_protection_template (
    id boolean PRIMARY KEY DEFAULT true,
    content_html text NOT NULL DEFAULT '',
    version text NOT NULL DEFAULT '1.0',
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT data_protection_template_single_row CHECK (id = true)
);

-- Tabla: blog_categories
CREATE TABLE blog_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    order_index integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: blog_posts
CREATE TABLE blog_posts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    excerpt text,
    content_html text NOT NULL,
    featured_image_path text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: faqs
CREATE TABLE faqs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    question text NOT NULL,
    answer_html text NOT NULL,
    category text,
    order_index integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: public_phrases (frases públicas configurables)
CREATE TABLE public_phrases (
    key text PRIMARY KEY,
    value text NOT NULL,
    description text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: social_links (redes sociales)
CREATE TABLE social_links (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform text NOT NULL,
    url text NOT NULL,
    icon text,
    order_index integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: site_images (imágenes por hueco)
CREATE TABLE site_images (
    placeholder text PRIMARY KEY,
    image_path text NOT NULL,
    alt_text text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: email_settings (configuración email, contraseña en Vault)
CREATE TABLE email_settings (
    id boolean PRIMARY KEY DEFAULT true,
    smtp_host text NOT NULL DEFAULT 'smtp.gmail.com',
    smtp_port integer NOT NULL DEFAULT 587,
    smtp_user text NOT NULL,
    smtp_password_encrypted text,
    from_name text NOT NULL DEFAULT 'PsicoCMS',
    from_email text NOT NULL,
    notifications_enabled boolean NOT NULL DEFAULT false,
    notify_on_booking boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT email_settings_single_row CHECK (id = true)
);

-- Tabla: rate_limit_events (control de intentos)
CREATE TABLE rate_limit_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier text NOT NULL,
    event_type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_limit_events_identifier_type ON rate_limit_events (identifier, event_type, created_at);

-- Tabla: dashboard_preferences (preferencias del panel)
CREATE TABLE dashboard_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme_mode text NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
    primary_color text NOT NULL DEFAULT '#2563eb',
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices adicionales para rendimiento
CREATE INDEX idx_patients_phone ON patients (phone);
CREATE INDEX idx_patients_patient_number ON patients (patient_number);
CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX idx_appointments_starts_at ON appointments (starts_at);
CREATE INDEX idx_appointments_modality_starts_at ON appointments (modality, starts_at);
CREATE INDEX idx_availability_slots_modality_day ON availability_slots (modality, day_of_week);
CREATE INDEX idx_clinical_records_patient_id ON clinical_records (patient_id);
CREATE INDEX idx_clinical_files_patient_id ON clinical_files (patient_id);
CREATE INDEX idx_blog_posts_status_published_at ON blog_posts (status, published_at);
CREATE INDEX idx_blog_posts_category_id ON blog_posts (category_id);