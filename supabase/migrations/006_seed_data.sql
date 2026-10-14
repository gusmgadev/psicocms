-- 006_seed_data.sql
-- Datos iniciales: categorías de blog por defecto, 5 temas, frases públicas por defecto

-- ============================================================
-- Categorías de blog por defecto
-- ============================================================
INSERT INTO blog_categories (name, slug, description, order_index, is_active) VALUES
    ('Ansiedad', 'ansiedad', 'Artículos sobre trastornos de ansiedad y manejo del estrés', 1, true),
    ('Depresión', 'depresion', 'Información sobre depresión, síntomas y tratamientos', 2, true),
    ('Relaciones', 'relaciones', 'Psicología de pareja, familia y relaciones interpersonales', 3, true),
    ('Autoestima', 'autoestima', 'Trabajo en autoestima, autoconocimiento y crecimiento personal', 4, true),
    ('Terapia', 'terapia', 'Información sobre tipos de terapia y proceso terapéutico', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Registro de los 5 temas visuales
-- ============================================================
-- Se guardan en site_settings o una tabla themes si se prefiere
-- Por ahora usamos public_phrases para el tema base y site_settings para el activo

-- ============================================================
-- Frases públicas por defecto (clave/valor)
-- Estas son las strings que aparecen en los temas visuales
-- ============================================================
INSERT INTO public_phrases (key, value, description) VALUES
    -- Header / Navegación
    ('nav.inicio', 'Inicio', 'Enlace navegación: Inicio'),
    ('nav.sobre_mi', 'Sobre mí', 'Enlace navegación: Sobre mí'),
    ('nav.servicios', 'Servicios', 'Enlace navegación: Servicios'),
    ('nav.blog', 'Blog', 'Enlace navegación: Blog'),
    ('nav.faq', 'Preguntas frecuentes', 'Enlace navegación: FAQ'),
    ('nav.pide_cita', 'Pide cita', 'Enlace navegación: Pide cita'),
    ('nav.contacto', 'Contacto', 'Enlace navegación: Contacto'),

    -- Hero / Inicio
    ('hero.title', 'Psicología para tu bienestar', 'Título principal hero'),
    ('hero.subtitle', 'Acompañamiento profesional para gestionar emociones, superar dificultades y recuperar tu equilibrio', 'Subtítulo hero'),
    ('hero.cta_text', 'Pide tu cita', 'Texto botón CTA hero'),
    ('hero.cta_link', '/pide-cita', 'Enlace botón CTA hero'),

    -- Sobre mí
    ('about.title', 'Sobre mí', 'Título sección sobre mí'),
    ('about.subtitle', 'Conoce mi formación y forma de trabajo', 'Subtítulo sobre mí'),
    ('about.license_text', 'Colegiada nº', 'Texto número de colegiada'),
    ('about.approach_title', 'Mi enfoque', 'Título mi enfoque'),
    ('about.approach_text', 'Trabajo desde un enfoque integrador, adaptando la terapia a tus necesidades únicas.', 'Texto mi enfoque'),

    -- Servicios
    ('services.title', 'Servicios', 'Título sección servicios'),
    ('services.subtitle', 'Terapias adaptadas a tus necesidades', 'Subtítulo servicios'),
    ('services.online_label', 'Online', 'Etiqueta modalidad online'),
    ('services.inperson_label', 'Presencial', 'Etiqueta modalidad presencial'),
    ('services.duration_label', 'Duración: {minutes} min', 'Plantilla duración sesión'),

    -- Planes y precios
    ('plans.title', 'Planes y precios', 'Título sección planes'),
    ('plans.subtitle', 'Elige la opción que mejor se adapte a ti', 'Subtítulo planes'),
    ('plans.per_session', '/ sesión', 'Sufijo precio por sesión'),
    ('plans.monthly', '/ mes', 'Sufijo precio mensual'),
    ('plans.choose_btn', 'Elegir', 'Texto botón elegir plan'),

    -- Blog
    ('blog.title', 'Blog', 'Título página blog'),
    ('blog.subtitle', 'Artículos y recursos para tu bienestar', 'Subtítulo blog'),
    ('blog.read_more', 'Leer más', 'Enlace leer artículo'),
    ('blog.categories', 'Categorías', 'Título filtro categorías'),
    ('blog.no_posts', 'No hay artículos publicados aún', 'Estado vacío blog'),

    -- FAQ
    ('faq.title', 'Preguntas frecuentes', 'Título sección FAQ'),
    ('faq.subtitle', 'Resolvemos tus dudas más comunes', 'Subtítulo FAQ'),

    -- Pide cita / Formulario reserva
    ('booking.title', 'Pide tu cita', 'Título página reserva'),
    ('booking.subtitle', 'Reserva tu sesión de forma rápida y segura', 'Subtítulo reserva'),
    ('booking.modality_online', 'Sesión online', 'Label modalidad online'),
    ('booking.modality_inperson', 'Sesión presencial', 'Label modalidad presencial'),
    ('booking.name_label', 'Nombre completo', 'Label campo nombre'),
    ('booking.name_placeholder', 'Tu nombre y apellidos', 'Placeholder nombre'),
    ('booking.phone_label', 'Teléfono', 'Label campo teléfono'),
    ('booking.phone_placeholder', '600 000 000', 'Placeholder teléfono'),
    ('booking.email_label', 'Email (opcional)', 'Label campo email'),
    ('booking.email_placeholder', 'tu@email.com', 'Placeholder email'),
    ('booking.reason_label', 'Motivo de la consulta (opcional)', 'Label campo motivo'),
    ('booking.reason_placeholder', 'Cuéntame brevemente qué te trae aquí...', 'Placeholder motivo'),
    ('booking.consent_label', 'He leído y acepto la {policy_link}', 'Label consentimiento'),
    ('booking.consent_policy_text', 'política de privacidad', 'Texto enlace política'),
    ('booking.submit_btn', 'Reservar cita', 'Texto botón enviar'),
    ('booking.success_title', '¡Cita reservada!', 'Título éxito reserva'),
    ('booking.success_text', 'Te hemos enviado un email de confirmación. Puedes añadir la cita a tu calendario.', 'Texto éxito reserva'),
    ('booking.error_generic', 'Ha ocurrido un error. Inténtalo de nuevo más tarde.', 'Error genérico'),

    -- Contacto / Dónde estamos
    ('contact.title', 'Contacto', 'Título página contacto'),
    ('contact.subtitle', 'Estoy aquí para ayudarte', 'Subtítulo contacto'),
    ('contact.address_label', 'Dirección', 'Label dirección'),
    ('contact.phone_label', 'Teléfono', 'Label teléfono'),
    ('contact.email_label', 'Email', 'Label email'),
    ('contact.map_title', 'Dónde estamos', 'Título mapa'),

    -- Footer
    ('footer.rights', 'Todos los derechos reservados', 'Texto derechos footer'),
    ('footer.privacy', 'Política de privacidad', 'Enlace política privacidad'),
    ('footer.legal', 'Aviso legal', 'Enlace aviso legal'),
    ('footer.cookies', 'Política de cookies', 'Enlace política cookies'),

    -- General
    ('general.loading', 'Cargando...', 'Texto carga'),
    ('general.error', 'Ha ocurrido un error', 'Error genérico'),
    ('general.retry', 'Reintentar', 'Botón reintentar'),
    ('general.close', 'Cerrar', 'Botón cerrar'),
    ('general.save', 'Guardar', 'Botón guardar'),
    ('general.cancel', 'Cancelar', 'Botón cancelar'),
    ('general.delete', 'Eliminar', 'Botón eliminar'),
    ('general.edit', 'Editar', 'Botón editar'),
    ('general.add', 'Añadir', 'Botón añadir'),
    ('general.search', 'Buscar...', 'Placeholder búsqueda'),
    ('general.no_results', 'No se encontraron resultados', 'Estado vacío búsqueda'),

    -- Panel / Dashboard
    ('panel.title', 'Panel de administración', 'Título panel'),
    ('panel.welcome', 'Bienvenida, {name}', 'Saludo panel'),
    ('panel.logout', 'Cerrar sesión', 'Botón cerrar sesión'),
    ('panel.view_site', 'Ver web pública', 'Botón ver web'),
    ('panel.help', 'Ayuda', 'Botón ayuda')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Servicios por defecto (ejemplo)
-- ============================================================
INSERT INTO services (name, description, icon, order_index, is_active) VALUES
    ('Terapia individual', 'Sesiones one-to-one para trabajar dificultades personales', 'fa-user', 1, true),
    ('Terapia de pareja', 'Mejora la comunicación y resuelve conflictos en la relación', 'fa-heart', 2, true),
    ('Terapia familiar', 'Aborda dinámicas familiares y mejora la convivencia', 'fa-users', 3, true),
    ('Gestión de ansiedad', 'Técnicas para controlar ansiedad, estrés y ataques de pánico', 'fa-brain', 4, true),
    ('Autoestima y desarrollo personal', 'Fortalece tu autoestima y alcanza tus metas', 'fa-star', 5, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Especialidades por defecto (ejemplo)
-- ============================================================
INSERT INTO specialties (name, description, order_index, is_active) VALUES
    ('Trastornos de ansiedad', 'Trastorno de ansiedad generalizada, fobias, ansiedad social', 1, true),
    ('Depresión y trastornos del estado de ánimo', 'Depresión mayor, distimia, trastorno bipolar', 2, true),
    ('Problemas de pareja', 'Comunicación, confianza, separación, divorcio', 3, true),
    ('Autoestima y crecimiento personal', 'Autoconocimiento, asertividad, toma de decisiones', 4, true),
    ('Estrés y burnout', 'Estrés laboral, agotamiento, conciliación', 5, true),
    ('Trauma y EMDR', 'Procesamiento de experiencias traumáticas', 6, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Planes por defecto (ejemplo)
-- ============================================================
INSERT INTO plans (name, description, price_online, price_inperson, features, order_index, is_active) VALUES
    (
        'Sesión suelta',
        'Paga por sesión, sin compromiso',
        60.00,
        70.00,
        '["1 sesión de 50 min", "Online o presencial", "Cancelación 24h antes"]'::jsonb,
        1, true
    ),
    (
        'Bono 4 sesiones',
        'Ahorra reservando 4 sesiones',
        220.00,
        260.00,
        '["4 sesiones de 50 min", "Válido 2 meses", "Online o presencial", "Cancelación 24h antes"]'::jsonb,
        2, true
    ),
    (
        'Bono 8 sesiones',
        'Máximo ahorro para terapia continuada',
        400.00,
        480.00,
        '["8 sesiones de 50 min", "Válido 4 meses", "Online o presencial", "Cancelación 24h antes", "Prioridad en agenda"]'::jsonb,
        3, true
    )
ON CONFLICT DO NOTHING;