# MAP del proyecto: PsicoCMS

> Fuente de verdad del estado real. Si el código y este mapa no coinciden, gana el código y se corrige el mapa.
> Estado inicial: proyecto sin iniciar. Todo lo marcado como (planificado) aún no existe.

## Estado actual
- Fase en curso: FASE 0B (siguiente: FASE 0B, luego 0C)
- Última fase completada: FASE 0A

## Stack
- Next.js (App Router) + React + TypeScript estricto
- CSS nativo (global + CSS Modules), sin Tailwind
- Supabase: PostgreSQL, Auth, Storage, RLS, RPC
- Lógica de servidor: Server Actions y Route Handlers (instalación, login, reservas, email con nodemailer)
- Despliegue previsto: Vercel

## Estructura (implementado en FASE 0A)
- `supabase/migrations/`: SQL numerado (creado, vacío)
- `src/app/`: (public), instalacion, acceso-psicologa, panel-psicologa (cada una con su layout)
- `src/lib/supabase/`: cliente de navegador (browser.ts), de servidor (server.ts) y admin (admin.ts con server-only)
- `src/actions/`, `src/services/`, `src/themes/`, `src/components/ui/` (creados)
- `middleware.ts` protege `/panel-psicologa/*` y redirige a `/acceso-psicologa` sin sesión
- `.env.local` y `.env.example` con variables requeridas, `.gitignore` excluye `.env*.local`
- `.agents/skills/`: psicocms-seguridad, psicocms-citas, local-dates, psicocms-temas, psicocms-textos
- `.opencode/commands/`: 13 comandos personalizados

## Base de datos (planificado)
Tablas: professional_profile, site_settings, services, specialties, plans, availability_slots, vacation_periods, patients, appointments, clinical_records, clinical_files, data_protection_template, blog_categories, blog_posts, faqs, public_phrases, social_links, site_images, email_settings, dashboard_preferences
RPC: get_available_slots, create_public_booking, is_setup_completed, verify_login_phone
Buckets: public-images (público), clinical-files (privado), avatars
Funciones adicionales: is_owner, check_rate_limit. Tabla adicional: rate_limit_events.
Permisos de ejecución de cada función (completar en la FASE 0B): (pendiente)

## Recursos visuales (estado inicial, antes de la FASE 0C)
- `tema-visual-base`: index.html e interior.html, CSS (styles, responsive, fonts, reset), fuentes Castoro/Lexend/Montserrat en TTF, Font Awesome 6.1.2 completo (~17,6 MB), imágenes de stock.
- Problemas conocidos: 30+ variables de color con nombres genéricos, 7 `h1` en el index, textos con errores, fuentes y Font Awesome pesados, `psicologa.png` ~1 MB.
- `dashboard-design`: 5 pantallas de referencia (inicio, calendario, pacientes, blog, disponibilidad) con textos en inglés y nombre "Sanctuary CMS".
- Pendiente: verificar licencias de las imágenes de stock antes de redistribuirlas.

## Rutas (implementadas en FASE 0A)
- Públicas: /inicio, /sobre-mi, /servicios, /blog, /faq, /pide-cita, /contacto (bajo route group `(public)`)
- Panel: /panel-psicologa/* (requiere sesión, middleware), login en /acceso-psicologa, instalación en /instalacion
- Raíz `/` redirige a `/inicio`

## Decisiones técnicas
- Pacientes: clave primaria `id` (UUID) + `patient_number` correlativo legible. El teléfono es dato de contacto obligatorio, normalizado y NO único. Las urls usan el id interno.
- Reserva pública: se reutiliza la ficha si coinciden teléfono y nombre; si el teléfono existe con otro nombre se crea ficha nueva marcada como `possible_duplicate`.
- Si hay conflicto entre `dashboard-design` y AGENTS.md, manda AGENTS.md.
- Seguridad: ver sección "Seguridad" de AGENTS.md. `is_owner()` en todas las políticas de `authenticated`; `INSTALL_TOKEN` para la instalación; `create_public_booking` solo `service_role`; contraseña de Gmail no legible desde el cliente.
- CSS base: font-size 10px (1rem = 10px), variables de color con significado, rem para medidas.

## Historial de cambios
- 2026-10-14: FASE 0A completada - Proyecto Next.js inicializado, estructura de rutas, clientes Supabase, middleware, variables de entorno, build exitoso, primer commit.