# MAP del proyecto: PsicoCMS

> Fuente de verdad del estado real. Si el código y este mapa no coinciden, gana el código y se corrige el mapa.
> Estado inicial: proyecto sin iniciar. Todo lo marcado como (planificado) aún no existe.

## Estado actual
- Fase en curso: FASE 2 (siguiente: FASE 2)
- Última fase completada: FASE 1

## Stack
- Next.js (App Router) + React + TypeScript estricto
- CSS nativo (global + CSS Modules), sin Tailwind
- Supabase: PostgreSQL, Auth, Storage, RLS, RPC
- Lógica de servidor: Server Actions y Route Handlers (instalación, login, reservas, email con nodemailer)
- Despliegue previsto: Vercel

## Estructura (implementado en FASE 0A)
- `supabase/migrations/`: SQL numerado (8 migraciones aplicadas)
- `src/app/`: (public), instalacion, acceso-psicologa, panel-psicologa (cada una con su layout)
- `src/lib/supabase/`: cliente de navegador (browser.ts), de servidor (server.ts) y admin (admin.ts con server-only)
- `src/actions/`, `src/services/`, `src/themes/`, `src/components/ui/` (creados)
- `middleware.ts` protege `/panel-psicologa/*` y redirige a `/acceso-psicologa` sin sesión
- `.env.local` y `.env.example` con variables requeridas, `.gitignore` excluye `.env*.local`
- `.agents/skills/`: psicocms-seguridad, psicocms-citas, local-dates, psicocms-temas, psicocms-textos
- `.opencode/commands/`: 13 comandos personalizados

## Base de datos (implementado en FASE 0B)
**Tablas (22):**
- professional_profile, site_settings, services, specialties, plans, availability_slots, vacation_periods, patients, appointments, clinical_records, clinical_files, data_protection_template, blog_categories, blog_posts, faqs, public_phrases, social_links, site_images, email_settings, dashboard_preferences, rate_limit_events

**Funciones RPC (6):**
- `is_owner()` — authenticated, service_role
- `get_available_slots(modality, date_from, date_to)` — authenticated, service_role
- `create_public_booking(...)` — **solo service_role**
- `is_setup_completed()` — anon, authenticated, service_role
- `verify_login_phone(phone)` — authenticated (requiere is_owner()), service_role
- `check_rate_limit(identifier, event_type, max_attempts, window)` — **solo service_role**

**Buckets Storage (3):**
- `public-images` (público, jpg/png/webp, 5MB)
- `clinical-files` (privado, jpg/png/webp/pdf, 15MB)
- `avatars` (público, jpg/png/webp, 2MB)

**RLS:** Activado en todas las tablas. Políticas:
- `anon`: solo lectura de contenido público (servicios, especialidades, planes, FAQs, blog publicado, categorías, frases, redes, imágenes, plantilla protección datos)
- `authenticated`: **solo si `is_owner()` = true** — CRUD completo en todo excepto `email_settings` (solo SELECT, sin contraseña)
- `service_role`: acceso total a todo (para Server Actions)

**Restricciones clave:**
- `patients.phone`: CHECK solo dígitos, NO único, índice
- `patients.patient_number`: generado automático (trigger), único (P-0001, P-0002...)
- `appointments`: restricción de exclusión (btree_gist) con `tstzrange` para evitar solapamiento citas activas
- `email_settings.smtp_password_encrypted`: nunca legible desde el cliente (solo service_role)

**Datos semilla:** 6 categorías blog, 5 temas registrados, ~60 frases públicas por defecto, 5 servicios, 6 especialidades, 3 planes

**Tipos TypeScript:** Generados en `src/lib/supabase/database.types.ts`

## Recursos visuales (completado en FASE 0C)

### Tema base (`src/themes/base/`)
- CSS modular: `variables.css` (variables semánticas), `reset.css`, `styles.css`, `responsive.css`, `index.css`
- Variables de color consolidadas: 48 variables genéricas → ~25 variables semánticas (ver mapeo abajo)
- Un único `h1` por página (corregido duplicado header desktop/mobile)
- Textos corregidos: "Piscologia" → "Psicología", "asesoriamiento" → "asesoramiento", "luenes" → "lunes"
- Textos de relleno con nombres propios (Maria Garcia, Victor Robles) marcados para ser datos configurables

### Font Awesome (`public/fonts/fontawesome/`)
- Conservado: `all.min.css` + `webfonts/` (4 archivos WOFF2: fa-solid-900, fa-regular-400, fa-brands-400, fa-v4compatibility)
- Eliminado: SVGs, JS, LESS, SCSS, sprites, TTFs, metadatos (~17MB → ~300KB)

### Fuentes propias (`public/fonts/`)
- **Castoro**: Regular, Italic (2 archivos TTF) — para títulos display
- **Lexend**: Regular, Medium, SemiBold, Bold (4 pesos TTF) — para UI/cuerpo
- **Montserrat**: Regular, Medium, SemiBold, Bold (4 pesos TTF) — para precios/datos numéricos
- **PENDIENTE**: Convertir a WOFF2 y mantener solo pesos usados. Usar `next/font/local` (ver `src/lib/fonts.ts`)

### Imágenes de stock (`public/images/stock/`) — **VERIFICAR LICENCIAS**
| Archivo | Tamaño | Uso en tema |
|---------|--------|-------------|
| background-nav.jpg | 101 KB | Banner background |
| beneficts1.jpg | 28 KB | Beneficios terapia |
| bg-contactnow.png | 43 KB | Contacto aside |
| bg-services.png | 38 KB | Servicios background |
| bg-stats.png | 138 KB | Stats/Appointment background |
| blog1.jpg | 28 KB | Blog artículo 1 |
| blog2.jpg | 25 KB | Blog artículo 2 |
| blog3.jpg | 25 KB | Blog artículo 3 |
| casos1.jpg | 15 KB | Caso 1 |
| casos2.jpg | 20 KB | Caso 2 |
| casos3.jpg | 19 KB | Caso 3 |
| exp1.jpg | 68 KB | Experiencia imagen principal |
| footer-shape.png | 56 KB | Footer shape decorativo |
| logo.png | 8 KB | Logo |
| person.jpg | 218 KB | Persona genérica |
| psicologa.jpg | 29 KB | Psicóloga (about) |
| psicologa.png | 1010 KB | **Psicóloga principal (banner) — OPTIMIZAR A WEBP** |
| psicologia.jpg | 268 KB | Pareja/psicología |
| question1.jpg | 13 KB | Preguntas aside |
| sandwich.png | 16 KB | Banner sandwich badge |
| servicio1.jpg | 10 KB | Servicio 1 / Video thumbnail |
| servicio2.jpg | 10 KB | Servicio 2 |
| servicio3.jpg | 12 KB | Servicio 3 |
| servicio4.jpg | 12 KB | Servicio 4 |
| shape-contactnow.png | 51 KB | Shape decorativo contacto |
| shape-question.png | 33 KB | Shape decorativo preguntas |
| shape-titles.png | 1.5 KB | Animación títulos |
| shape1.png | 30 KB | Shape animado banner |
| shape2.png | 2 KB | Shape animado banner |
| terapia1.jpg | 20 KB | Terapia 1 card |
| terapia2.jpg | 18 KB | Terapia 2 card |
| terapia3.jpg | 23 KB | Terapia 3 card |
| tips.jpg | 44 KB | Tips aside interior |
| title-issues.png | 4 KB | Animación título banner |
| why.jpg | 7 KB | Logo stats experiencia |

### Dashboard Design Tokens (extraídos de `dashboard-design/`)
```css
:root {
  /* Panel colors */
  --panel-bg: #f8fafc;           /* Fondo principal */
  --panel-surface: #ffffff;      /* Tarjetas, modales */
  --panel-border: #e2e8f0;       /* Bordes */
  --panel-text: #1e293b;         /* Texto principal */
  --panel-text-muted: #64748b;   /* Texto secundario */
  --panel-primary: #2563eb;      /* Azul principal (botones, links activos) */
  --panel-primary-hover: #1d4ed8;
  --panel-primary-light: #eff6ff; /* Fondos activos */
  --panel-success: #059669;      /* Verde éxito */
  --panel-warning: #d97706;      /* Amarillo advertencia */
  --panel-danger: #dc2626;       /* Rojo peligro */
  
  /* Typography */
  --panel-font-sans: 'Inter', system-ui, sans-serif;
  --panel-font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing (base 10px = 1rem) */
  --panel-space-xs: 0.4rem;
  --panel-space-sm: 0.8rem;
  --panel-space-md: 1.6rem;
  --panel-space-lg: 2.4rem;
  --panel-space-xl: 3.2rem;
  
  /* Radius */
  --panel-radius-sm: 0.4rem;
  --panel-radius-md: 0.8rem;
  --panel-radius-lg: 1.2rem;
  
  /* Shadows */
  --panel-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --panel-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --panel-shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  
  /* Transitions */
  --panel-transition: 150ms ease;
  
  /* Sidebar */
  --panel-sidebar-width: 16rem;  /* 256px */
  --panel-header-height: 4rem;   /* 64px */
}
```

### Mapeo de variables de color (original → semántica)
| Original | Semántica | Valor |
|----------|-----------|-------|
| --color-primary | --color-primario | #976147 |
| --color-orange | --color-primario-oscuro | #66493d |
| --color-orange2 | --color-primario-claro | #c0a090 |
| --color-orange4 | --color-primario-muy-claro | #ffe4d7 |
| --color-brown | --color-primario-fuerte | #5b4034 |
| --color-brown3 | --color-primario-muy-fuerte | #7e533f |
| --color-white | --color-fondo | #eee8e5 |
| --color-white2 | --color-fondo-blanco | #ffffff |
| --color-white3 | --color-fondo-alt | #f1ece9 |
| --color-white4 | --color-fondo-suave | #f2edea |
| --color-white5 | --color-fondo-muy-suave | #ebe6e3 |
| --color-gray | --color-borde | #ccc → #dfdfdf |
| --color-gray2 | --color-texto-suave | #736b6b |
| --color-gray3 | --color-texto-muy-suave | #9f9999 |
| --color-black | --color-texto | #1a1414 |
| --color-black4 | --color-fondo-oscuro | #120e0e |
| --color-black5 | --color-fondo-oscuro | #474747 |
| --color-brown2 | --color-primario-oscuro | #664332 |
| (y 30+ más consolidadas en ~25 semánticas) | | |

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
- Región Supabase: **eu-west-1** (anotar la tuya si es diferente)

## Rutas API (implementadas en FASE 1)
- `POST /api/instalacion/verificar-conexion` — Verifica conectividad con Supabase
- `POST /api/instalacion/subir-foto` — Sube foto de la psicóloga a Storage `public-images`
- `POST /api/instalacion/ejecutar` — Ejecuta instalación completa (Server Action)
- `GET /api/instalacion/verificar-instalacion` — Verifica si `setup_completed` es true

## Historial de cambios
- 2026-10-14: FASE 0A completada - Proyecto Next.js inicializado, estructura de rutas, clientes Supabase, middleware, variables de entorno, build exitoso, primer commit.
- 2026-10-14: FASE 0B completada - Base de datos creada con 22 tablas, RLS, 6 funciones RPC, 3 buckets Storage, tipos TypeScript generados, seed data aplicado.
- 2026-10-14: FASE 0C completada - Recursos visuales preparados: variables semánticas, Font Awesome ligero, fuentes copiadas (pendiente WOFF2), imágenes de stock listadas para verificación de licencias, tokens de panel extraídos, build verificado.
- 2026-10-15: FASE 1 completada - Asistente de instalación en `/instalacion` con 5 pasos: conexión, datos de acceso, información profesional, foto, tema. Server Action `instalar` con cliente admin, validación de `INSTALL_TOKEN`, creación de usuario en Auth, perfil profesional, site_settings, servicios, especialidades, planes, disponibilidad. Barra de progreso, modo landing/multipágina, 5 temas disponibles. `npm run build` exitoso.