# MAP del proyecto: PsicoCMS

> Fuente de verdad del estado real. Si el código y este mapa no coinciden, gana el código y se corrige el mapa.
> Estado inicial: proyecto sin iniciar. Todo lo marcado como (planificado) aún no existe.

## Estado actual
- Fase en curso: — (siguiente: —; todas las fases del plan completadas o con pasos manuales pendientes)
- Última fase completada: FASE 19 (implementación); quedan pasos manuales del usuario (desplegar, probar abuso, backups, dominio)

## Stack
- Next.js (App Router) + React + TypeScript estricto
- CSS nativo (global + CSS Modules), sin Tailwind
- Supabase: PostgreSQL, Auth, Storage, RLS, RPC
- Lógica de servidor: Server Actions y Route Handlers (instalación, login, reservas, email con nodemailer)
- Despliegue previsto: Vercel

## Estructura (implementado en FASE 0A)
- `supabase/migrations/`: SQL numerado (15 ficheros; **001–015 aplicadas** en el proyecto Supabase)
- `src/app/`: (public), instalacion, acceso-psicologa, panel-psicologa (cada una con su layout)
- `src/lib/supabase/`: cliente de navegador (browser.ts), de servidor (server.ts) y admin (admin.ts con server-only)
- `src/actions/`, `src/services/`, `src/themes/`, `src/components/ui/` (creados)
- `proxy.ts` (renombrado desde `middleware.ts` en FASE 19) protege `/panel-psicologa/*` y redirige a `/acceso-psicologa` sin sesión
- `.env.local` y `.env.example` con variables requeridas, `.gitignore` excluye `.env*.local`
- `.agents/skills/`: psicocms-seguridad, psicocms-citas, local-dates, psicocms-temas, psicocms-textos
- `.opencode/commands/`: 13 comandos personalizados (equivalen a los prompts de la carpeta `0 recursos/prompts/`)

## Base de datos (implementado en FASE 0B)
**Tablas (23):**
- professional_profile, site_settings, services, specialties, plans, availability_slots, vacation_periods, patients, appointments, clinical_records, clinical_files, data_protection_template, blog_categories, blog_posts, faqs, public_phrases, social_links, site_images, email_settings, dashboard_preferences, rate_limit_events, **privacy_policy** (migración 015)

**Funciones RPC (6):**
- `is_owner()` — authenticated, service_role
- `get_available_slots(modality, date_from, date_to)` — authenticated, service_role
- `create_public_booking(...)` — **solo service_role**
- `is_setup_completed()` — anon, authenticated, service_role
- `verify_login_phone(phone)` — authenticated (requiere is_owner()), service_role
- `check_rate_limit(identifier, event_type, max_attempts, window)` — **solo service_role**

**Migración 008 (FASE 4, aplicada):**
- Añade `site_settings.timezone` (`text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires'`, IANA; valor elegido por la usuaria)
- Corrige `get_available_slots`: la ventana devuelta dura la **sesión** (`session_duration`) y el avance entre huecos es **sesión + descanso**; los instantes se convierten con `AT TIME ZONE timezone`; guardas contra bucle infinito al envolver las 24:00 y contra paso 0
- Corrige `create_public_booking`: exige `ends_at - starts_at = duración de sesión` (no sesión+descanso), comprueba vacaciones en fecha local, y valida que el inicio encaja en un hueco de `availability_slots` (día local + múltiplo del paso)

**Migración 009 (fix post-FASE 4, aplicada):**
- Recrea `appointments_no_overlap` **sin** `modality WITH =`: dos citas activas no se solapan ni entre modalidades (online y presencial comparten agenda). Un inicio exactamente al terminar otra (o al acabar su descanso) se permite: la exclusión es estricta (`<` / `>`). Si ya existen solapes cruzados, la migración se detiene con un mensaje indicando cuántas citas resolver en el panel (todo se revierte en el SQL Editor)
- `get_available_slots`: un hueco figura como ocupado por cualquier cita activa, sea cual sea su modalidad
- `create_public_booking`: la revalidación de solape mira cualquier modalidad; el límite de 3 citas futuras por teléfono sigue contando **por modalidad**
- Sin cambios de permisos (`CREATE OR REPLACE` conserva los grants existentes)

**Migración 010 (FASE 8B, aplicada):**
- Añade `clinical_records.appointment_id` (`uuid NULL REFERENCES appointments(id) ON DELETE SET NULL`): enlace opcional entre una nota de historia y su cita; la nota es propia (`session_date` propio) y sobrevive si la cita se borra (el FK vacía el enlace) o se cancela (el servicio de citas vacía el enlace en el servidor)
- Índices creados en la 010: `idx_clinical_records_appointment_id` (búsqueda) y `idx_clinical_records_appointment_unique` (parcial WHERE NOT NULL, anulado por la 011)
- Sin cambios de políticas RLS (`is_owner()` en `clinical_records` ya cubre la columna nueva); sin funciones RPC nuevas

**Migración 011 (varias notas por cita, aplicada):**
- `DROP INDEX IF EXISTS idx_clinical_records_appointment_unique` (decisión 2026-10-18: una cita puede tener varias notas de sesión)
- Solo elimina un índice; sin cambios de RLS, políticas ni funciones

**Buckets Storage (3):**
- `public-images` (público, jpg/png/webp, 5MB)
- `clinical-files` (privado, jpg/png/webp/pdf, 15MB)
- `avatars` (público, jpg/png/webp, 2MB)

**RLS:** Activado en todas las tablas. Políticas:
- `anon`: solo lectura de contenido público (servicios, especialidades, planes, FAQs, blog publicado, categorías, frases, redes, imágenes, plantilla protección datos, **política de privacidad**)
- `authenticated`: **solo si `is_owner()` = true** — CRUD completo en todo; en `email_settings` solo lectura de las columnas no secretas (grants por columnas desde la migración 014: la contraseña SMTP solo la lee/escrive `service_role`)
- `service_role`: acceso total a todo (para Server Actions)

**Restricciones clave:**
- `patients.phone`: CHECK solo dígitos, NO único, índice
- `patients.patient_number`: generado automático (trigger), único (P-0001, P-0002...)
- `appointments`: restricción de exclusión (btree_gist) con `tstzrange` para evitar solapamiento de citas activas, **sin distinguir modalidad** (mig. 009; antes sí la distinguía)
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
- Estructura: `css/all.min.css` + `webfonts/` (4 archivos WOFF2: fa-solid-900, fa-regular-400, fa-brands-400, fa-v4compatibility)
- Enlazado en el layout raíz (`src/app/layout.tsx`) vía `<link href="/fonts/fontawesome/css/all.min.css">`
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
- Públicas: /inicio, /sobre-mi, /servicios, /blog, /faq, /pide-cita, /contacto, **/politica-privacidad** (FASE 15; bajo route group `(public)`)
- Panel: /panel-psicologa/* (requiere sesión, middleware), login en /acceso-psicologa, instalación en /instalacion
- Raíz `/` redirige a `/inicio`

## Decisiones técnicas
- Pacientes: clave primaria `id` (UUID) + `patient_number` correlativo legible. El teléfono es dato de contacto obligatorio, normalizado y NO único. Las urls usan el id interno.
- Reserva pública: se reutiliza la ficha si coinciden teléfono y nombre; si el teléfono existe con otro nombre se crea ficha nueva marcada como `possible_duplicate`.
- Cita y nota de sesión: la cita (`appointments`) es lo agendado y la nota (`clinical_records`) es lo clínico. Estados de cita: pendiente (`scheduled`, por defecto), realizada (`completed`), cancelada (`cancelled`), no asistió (`no_show`); cancelada/no asistió libera el hueco (la restricción de exclusión solo cuenta `scheduled`/`completed`). La nota pertenece a un paciente y puede enlazarse a una cita (opcional, `ON DELETE SET NULL`); **una cita puede tener varias notas** (decisión 2026-10-18) y puede haber notas sin cita. El motivo de la cita y el contenido clínico son datos distintos y no se copian entre sí; las notas nunca se muestran en calendario, listados ni emails. Vocabulario de interfaz: "cita" = lo agendado, "nota de sesión" = lo clínico.
- Si hay conflicto entre `dashboard-design` y AGENTS.md, manda AGENTS.md.
- Seguridad: ver sección "Seguridad" de AGENTS.md. `is_owner()` en todas las políticas de `authenticated`; `INSTALL_TOKEN` para la instalación; `create_public_booking` solo `service_role`; contraseña de Gmail no legible desde el cliente.
- CSS base: font-size 10px (1rem = 10px), variables de color con significado, rem para medidas.
- Región Supabase: **eu-west-1** (anotar la tuya si es diferente)
- Next 16.4.1: `middleware.ts` **renombrado a `proxy.ts`** con `export async function proxy` (FASE 19); el matcher y la lógica de protección son los mismos
- `/debug-login`: ruta de diagnóstico solo en desarrollo (`notFound()` en producción y exige `INSTALL_TOKEN`); se puede eliminar del repositorio si se prefiere

## Rutas API (implementadas en FASE 1)
- `POST /api/instalacion/verificar-conexion` — Valida `INSTALL_TOKEN` (recibido por FormData, con trim) y verifica conectividad con Supabase
- `POST /api/instalacion/subir-foto` — Sube foto de la psicóloga a Storage `public-images`
- `POST /api/instalacion/ejecutar` — Ejecuta instalación completa (Server Action)
- `GET /api/instalacion/verificar-instalacion` — Verifica si `setup_completed` es true

## Rutas API (implementadas en FASE 2)
- `POST /api/auth/recover` — Recuperación de contraseña (respuesta idéntica exista o no la cuenta)
- `POST /api/auth/logout` — Cierre de sesión
- `GET /api/auth/session` — Obtiene usuario actual para header del panel

## Server Actions de autenticación (FASE 2)
- `loginAction` — Login con email+password, verifica teléfono via RPC `verify_login_phone`, rate limiting por IP/email, cookies persistentes opcionales. Desde la FASE 15 devuelve `mfaRequerido: true` si hay verificación en dos pasos activada (sin cerrar la sesión de primer factor)
- `logoutAction` — Cierre de sesión
- `recoverPasswordAction` — Recuperación de contraseña
- `updatePasswordAction` — Cambio de contraseña con verificación de contraseña actual

## UI base del panel (corrección posterior a FASE 2)
Clases globales reutilizables en `src/app/globals.css` (sin Tailwind), usadas por instalación, acceso y panel:
- Formularios: `.campo-label`, `.campo-control` (+ `--error`), `.campo-error`, `.campo-hint`, `.fila-check`
- Botones: `.boton` + `--primario`, `--secundario`, `--peligro`, `--bloque`
- Alertas: `.alerta` + `--error`, `--exito`, `--aviso`
- Otros: `.tarjeta`
- CSS Modules por área: `instalacion.module.css`, `acceso.module.css`, `panel.module.css`, `publico.module.css`
- Variables añadidas: `--color-primario-claro`, `--color-exito(-fondo)`, `--color-aviso(-fondo)`, `--color-peligro(-fondo)`

## Rediseño UI del panel (2026-10-16, skill `frontend-design`)
- Tipografía: Lexend (400/500/600) vía `next/font/local` en `src/app/layout.tsx` (var `--font-panel`); Castoro solo para el logotipo "PsicoCMS" (var `--font-marca`). El tema público podrá sobreescribir con su `--font-sans`
- Tokens nuevos: `--color-app: #f1f5f9` (fondo del shell; distinto del hover `--color-fondo-alt`); sombras suavizadas (rgb 15 23 42); foco global `:focus-visible`; `prefers-reduced-motion` respetado en `globals.css`
- Shell: marca en sidebar (badge + Castoro), ítem activo con barra de acento izquierda, header más sobrio (título suave 1.4rem), contenido con padding 3.2rem
- `.tarjeta` y tarjetas de estadísticas sin sombra (solo borde); `statValor` con `tabular-nums`; cabeceras de tabla sin mayúsculas
- El color primario azul `#2563eb` se mantiene (fijado por `dashboard-design`); la personalidad la aportan tipografía y estructura, no un color nuevo

## Panel de administración (FASE 3)
### Layout y menú
- `layout.tsx` (servidor): verifica sesión con `getUser()`, redirige a `/acceso-psicologa` si no hay sesión, envuelve en `ToastProvider` y renderiza `PanelShell` con datos del usuario
- `PanelShell.tsx` (cliente): sidebar con menú + header. Cierra el menú móvil al navegar.
- Menú lateral: Inicio, Citas, Calendario, Pacientes, Historias clínicas, Disponibilidad (acceso directo); Gestión web y Configuración (desplegables); Ayuda y Ver web pública (al pie)
- Responsive: sidebar fija en escritorio (<1024px se convierte en cajón con overlay y hamburguesa)
- Header: título, enlace a Ayuda, botón Cerrar sesión

### Componentes reutilizables (`src/components/ui/`)
Todos con CSS Modules y tokens del panel; exportados desde `src/components/ui/index.ts`:
- `Modal` — overlay, cierre con Escape/clic fuera, anchos normal/estrecho, pie con acciones
- `ConfirmarModal` — confirmación destructiva en dos pasos ("Confirmar" → "Sí, estoy segura"), sin `alert`/`confirm` del navegador
- `ToastProvider` / `useToast` — avisos flotantes (exito/error/info), auto-cierre a los 4.5s, `aria-live`
- `EmptyState` — estado vacío con icono, título, descripción y acción opcional
- `TablaPaginada` — tabla genérica con columnas renderizables, paginación y total de registros
- `Campo` — envoltorio de formulario (label + control + error/pista), reutiliza clases globales

### Patrón de sesión y servicios
- `src/lib/auth-guard.ts` (`import "server-only"`):
  - `exigirSesion()` — devuelve `{ user }` o redirige a `/acceso-psicologa`; usar al inicio de toda Server Action del panel
  - `getSesionOPcional()` — devuelve `{ user }` o `null` sin redirigir
- `src/services/dashboard.ts` — ejemplo de capa de servicios: consulta Supabase y devuelve datos; las Server Actions validan sesión y llaman a servicios
- Patrón recomendado: Server Action → `exigirSesion()` → servicio (`src/services/*`) → respuesta tipada `{ ok, data?, error? }`

### Páginas placeholder
Cada sección del menú tiene página con `PaginaSeccion` (h1 + EmptyState "Sección en preparación") para que la navegación funcione; se implementarán en sus fases (4–15). En FASE 4 se sustituyeron **Inicio**, **Disponibilidad** y **Citas**; en FASE 5, **Calendario**.

## Inicio, disponibilidad y citas (FASE 4)

### Servicios (`src/services/`, todos con `import "server-only"`)
- `disponibilidad.ts` — `getEstadoDisponibilidad()` (perfil + ajustes + huecos + periodos), `guardarConfigSesiones()` (compara con lo anterior y devuelve avisos de "revisa los huecos"), `guardarHuecos(modality, marcas)` (borra e inserta los huecos de la modalidad; `end_time = inicio + sesión + descanso`, rechaza si excede 24:00), `setModoVacaciones()`, `crear/borrarPeriodoVacaciones()`, `obtenerTimezone()`
- `citas.ts` — `listarCitas(filtros)` (estado, modalidad, rango de fechas local, búsqueda por nombre/teléfono/ficha, paginación 10/pág., orden cronológico ascendente), `listarPacientesParaCita()`, `crearCita()` / `editarCita()` / `eliminarCita()`; validación de solapamiento en servidor en dos comprobaciones (misma modalidad con ventana de paso sesión+descanso; **cualquier modalidad por solape de rangos almacenados**) + error `23P01` de la BD traducido a mensaje amable; `crearPaciente` inline con aviso (sin bloquear) si el teléfono ya existe (`possible_duplicate = true`)
- `dashboard.ts` — `getResumenInicio()` con consultas reales: citas de la semana (lunes→domingo en zona de la psicóloga), totales de pacientes, próximas citas, altas del mes, y las listas de próximas citas y pacientes recientes

### Server Actions (`src/actions/`)
- `disponibilidad.ts`: `guardarConfigAction`, `guardarHuecosAction`, `setModoVacacionesAction`, `crearPeriodoAction`, `borrarPeriodoAction`
- `citas.ts`: `listarCitasAction`, `listarPacientesAction`, `crearCitaAction`, `editarCitaAction`, `eliminarCitaAction`
- Todas usan `exigirSesion()` antes de tocar el servicio

### Páginas
- `/panel-psicologa` — stats reales + listas de próximas citas y pacientes recientes (con empty states)
- `/panel-psicologa/disponibilidad` — `DisponibilidadPanel`: duración y descanso por modalidad con aviso al cambiarlos; horario semanal de 7 días (Lun→Dom) marcable con clic, con pestañas Online/Presencial y selectores de hora de entrada/salida (solo definen el rango visible de la rejilla); modo vacaciones y periodos lado a lado (fechas con inputs HTML5, alta y borrado con ConfirmarModal)
- `/panel-psicologa/citas` — `CitasPanel`: filtros (estado, modalidad, desde/hasta, búsqueda), TablaPaginada, modal crear/editar (paciente existente o creación inline de paciente, modalidad, fecha/hora, estado, motivo), eliminar con ConfirmarModal

### Utilidades de fechas (`src/lib/fechas.ts`, servidor y navegador)
- `DIAS_SEMANA` (Lun=1 … Dom=0, igual que `EXTRACT(DOW)`), `formatearFecha/Hora` (Intl, es-ES, `hourCycle: 'h23'`, zona de la psicóloga), `hoyEnZona`, `lunesDeLaSemana`, `sumarDias`, `instanteDesdeLocal` (dos pasadas con Intl, sin librerías), `partesParaInputs`, `minutosATexto/textoAMinutos`, `formatearFechaCadena`

### Decisiones FASE 4
- **Convención de duración**: la cita dura la sesión; el descanso solo separa inicios. Aplicada en la BD (migración 008), en los servicios del panel y en la reserva pública.
- **Citas manuales**: pueden ser a cualquier hora (no exigen caer en la rejilla), pero sí respetan solapamiento y descanso. La restricción de exclusión de la BD sigue siendo la garantía final.
- **Listado de citas**: por defecto "desde = hoy" en la zona de la psicóloga y orden ascendente (lo próximo arriba); 10 citas por página.
- **Zona horaria**: `site_settings.timezone` = `America/Argentina/Buenos_Aires` por defecto (cambiable cuando haya interfaz para ello). El servidor es la autoridad al convertir fecha+hora locales a instantes.
- Bug prevenido en SQL: la aritmética de `time` envuelve al pasar de 24:00 (un hueco marcado de 23:00 habría provocado un bucle infinito en `get_available_slots`); se añadió guardia de envolución en 008.
- **Solapes entre modalidades bloqueados** (fix a petición del usuario): online y presencial comparten agenda. Se corrigieron las 4 capas (migración 009: constraint + ambas RPC; `hayConflicto` en `src/services/citas.ts`). Entre modalidades solo aplica el solape directo de rangos (sin descanso cruzado): online 9:00–9:50 + presencial 9:50–10:40 se permite; ambas a las 9:00 se rechazan. El límite de citas futuras por teléfono sigue siendo por modalidad.

## Calendario de citas (FASE 5)

### Página y componente
- `/panel-psicologa/calendario` — servidor: `exigirSesion()` + citas del rango ±45 días (`porPagina: 500`) + pacientes; `CalendarioPanel.tsx` (cliente) monta Calendar.js

### Librería: Calendar.js (npm `jcalendar.js` v2.12.6, MIT, 0 dependencias)
- Verificada para React/Next cargada SOLO en cliente como script global, como Font Awesome: copiada a `public/vendor/calendarjs/` (`calendar.min.js`, `calendar.min.css`, `translations/calendar.translations.es.js`), versión fijada en el repositorio. El paquete no expone UMD ni tipos TS: `src/types/calendarjs.d.ts` declara la API mínima; `src/lib/calendarjs-loader.ts` inyecta `<link>`+`<script>` de forma idempotente
- **API real de la librería (fix "no pinta las citas")**: `window.calendarJs(elemento, opciones)` construye el calendario pero devuelve `undefined` (la fuente tiene `var q = this` sin `return`: la API de la instancia —`addEvents`, `clearEvents`, `refresh`, `getCurrentDisplayDate`, `updateEventDateTimes`, `destroy`…— se monta en `window`). `src/lib/calendarjs-loader.ts` expone `crearInstanciaCalendarJs()` que invoca el constructor y devuelve un envoltorio `InstanciaCalendarJs` con esos métodos; `CalendarioPanel.tsx` usa ese envoltorio (nunca el retorno del constructor)
- UI en español: `calendar.translations.es.js` define `window.__TRANSLATION_OPTIONS`, que se fusiona con nuestras opciones al instanciar

### Componente compartido
- `src/components/panel/CitaModal.tsx` (+ CSS Module): modal de crear/editar cita extraído de `CitasPanel` (props: `abierto`, `editando`, `pacientes`, `config`, `timezone`, `inicial` opcional `{fecha, hora}` para precargar fecha/hora al crear, `onCerrar`, `onGuardado`, `onEliminar` opcional). Exporta `ETIQUETAS_ESTADO` y `ETIQUETAS_MODALIDAD`. `CitasPanel` refactorizado para usarlo (mismo comportamiento); el CSS de formulario se movió a `CitaModal.module.css`

### Interacción
- Repintado de eventos: `sincronizar()` llama a `clearEvents(true, false)` y `addEvents(eventos, true, false)`; en Calendar.js v2.12.6 el segundo parámetro de `addEvents` y el primero de `clearEvents` son "repintar el DOM" (por defecto `true`). Las opciones se construyen con `opcionesConEspañol()` **dentro** del `.then()` de `cargarCalendarJs()`, cuando `calendar.min.js` y la traducción española ya están cargados (`calendar.min.js` no lee `window.__TRANSLATION_OPTIONS` por sí mismo)
- Clic en cita → CitaModal de edición. El editor interno de Calendar.js se suprime con `onBeforeEventAddEdit` (clic derecho/doble clic redirigen al mismo modal)
- Doble clic en un hueco libre (vistas mes/semana/día) o "+" interno → Calendar.js crea antes un evento de plantilla `* Nuevo evento` (`td()` lo añade al calendario); `onBeforeEventAddEdit` lo detecta porque no es una cita del mapa, lo elimina del calendario con `removeEvent` (nuevo en el envoltorio de `calendarjs-loader.ts`) y abre `CitaModal` precargado con la fecha/hora del hueco (prop `inicial`)
- Copiar/pegar de citas (menús contextuales: "Copiar" sobre la cita, "Pegar" sobre una celda) → el pegado añade el evento con `addEvent` y dispara `onEventAdded` (callback nuevo en `CalendarioPanel.tsx`): el evento no es una cita del mapa, se elimina del calendario en un microtask (la plantilla del doble clic se distingue con `plantillaGestionadaRef` porque su `onBeforeEventAddEdit` llega sincrónamente después); **la hora del pegado se recalcula con la posición del clic derecho** porque Calendar.js (`Yh`) solo cambia la fecha del evento copiado y conserva su hora original: un listener de `contextmenu` en fase capture (necesario: `C(a)` hace `preventDefault`+`cancelBubble`) sobre el contenedor guarda en `clicDerechoRef` la hora/minuto calculada de la celda (`Math.round((clientY - rect.top) / (rect.height / 1440))`); el microtask aplica `inicio.setHours(clic.hora, clic.min, 0, 0)` y `fin = inicio + duración` antes de comprobar `solapaOcupada` (scheduled/completed, cualquier modalidad): si solapa, toast "No se puede pegar ahí…" sin modal; si está libre, se abre `CitaModal` precargado con esa hora (el alta real se guarda al confirmar el modal, con validación en servidor). El modo cortar va por `onEventUpdated` y ya validaba en servidor
- No se pueden programar citas en el pasado: `crearCita`/`editarCita` (`src/services/citas.ts`) rechazan cuando el estado final es `scheduled` y el inicio es anterior a ahora (mensaje que invita a usar Completada/No presentó/Cancelada para registrar sesiones pasadas); `CitaModal.tsx` valida lo mismo en cliente y pone `min` en la fecha solo al crear con estado Programada. Aplica también al arrastrar y soltar (vía servidor)
- Arrastrar y soltar (vistas mes, semana y día) → `onEventUpdated` persiste con `editarCitaAction` (validación de solape y descanso en servidor); si falla o si el usuario cambia la duración, toast + reversión con `updateEventDateTimes`
- La duración es fija (la de la sesión): los resize se revierten
- Alta desde hueco libre: el doble clic abre `CitaModal` precargado (ver arriba); el botón "Nueva cita" abre con la fecha de hoy y hora vacía
- Colores de evento (hex fijos, pendientes de alinear con tokens cuando exista tema oscuro del panel): online `#2563eb`, presencial `#059669`, completada `#64748b`, cancelada/no presentó `#94a3b8` (color neutro, sin `locked`: canceladas y no presentó se pueden mover)
- Fechas visuales: helpers nuevos `fechaLocalDePartes`/`partesDeFechaLocal` en `src/lib/fechas.ts` — fechas "wall-clock" con los dígitos de la zona de la psicóloga para que el navegador no desplace nada
- Opciones: semana desde lunes (`startOfWeekDay: 0`), popups internos desactivados (se usan los Toast del panel), sin exportar/importar/configuración/búsqueda, feriados ocultos; al navegar de mes se recarga el rango visible (`onPreviousMonth`/`onNextMonth`/`onToday`/`onSetDate`)

## Blog y editor wysiwyg (FASE 6)

### Dependencia
- `jodit-react@5.8.3` (trae `jodit@4.18.3`), autorizada en AGENTS.md; cargada SOLO en cliente vía `dynamic(..., { ssr: false })`; CSS `jodit/es2021/jodit.min.css`; idioma `es` en la configuración

### Módulos nuevos
- `src/lib/sanitizar.ts` — `sanitizarHtml(html)` con `isomorphic-dompurify` (único camino permitido para `dangerouslySetInnerHTML`)
- `src/components/panel/EditorWysiwyg.tsx` — wrapper cliente del editor (altura configurable, botones limitados a lo necesario para blog)
- `src/services/blog.ts` (`import "server-only"`) — `listarArticulos`, `obtenerArticulo`, `crearArticulo`, `editarArticulo`, `eliminarArticulo`, `subirImagenDestacada` (jpg/png/webp, 5 MB, nombre UUID en `blog/` del bucket `public-images`, validado en servidor), `borrarImagenDestacada`, `listarCategorias`, `crear/editar/eliminarCategoria`; el HTML se sanea con DOMPurify **al guardar y al servir**; slug generado del título con unicidad; `published_at` se fija al pasar a "publicado"; revalida `/blog` y `/blog/[slug]` con `revalidatePath`
- `src/actions/blog.ts` — Server Actions con `exigirSesion()`: listar, obtener, crear, editar, eliminar (artículos y categorías), subir/borrar imagen (FormData)

### Rutas del panel
- `/panel-psicologa/blog` — listado paginado con filtros (búsqueda, estado, categoría), alta/edición/eliminación de artículos y botón "Categorías" (modal con CRUD: nombre, descripción, orden, activa; al borrar, los artículos quedan sin categoría porque el FK es `ON DELETE SET NULL`)
- `/panel-psicologa/blog/articulos/nuevo` — formulario con título, slug, resumen, editor wysiwyg (pestañas Editar/Vista previa sanitizada), imagen destacada y panel lateral de publicación (estado, categoría)
- `/panel-psicologa/blog/articulos/[id]` — edición (usa el id interno UUID; el slug no va en la URL del panel)

### Decisiones
- `blog_posts.featured_image_path` guarda la ruta relativa dentro del bucket (`blog/<uuid>.<ext>`); la URL pública se construye al servir
- **Límite de tamaño de Server Actions**: `next.config.ts` fija `experimental.serverActions.bodySizeLimit: "16mb"` (por defecto Next limita a 1 MB; se subió a 6 MB en la FASE 6 para imágenes destacadas y a 16 MB en la FASE 8 para archivos clínicos de hasta 15 MB); `ArticuloForm.tsx` valida tipo y tamaño en cliente y envuelve la subida en `try/catch/finally`
- La vista previa del panel sanitiza en el navegador; el servidor sanea al guardar y al devolver (defensa en profundidad)
- No hay migración nueva: `blog_posts`, `blog_categories`, sus políticas RLS (anon solo lectura de publicados/activos; owner CRUD con `is_owner()`) y el bucket `public-images` ya existían desde la FASE 0B
- **Node local mínimo: 20.19** (ideal 22+ o 24 LTS). `isomorphic-dompurify` usa `jsdom@27`/`@csstools` que exigen Node ≥20.19 al importarse en el servidor; en esta máquina se actualizó Node de v20.17.0 a **v24.20.0** para que compile. Vercel debe usar la misma versión mayor o superior

## Pacientes (FASE 7)

### Servicio y Server Actions
- `src/services/pacientes.ts` (`import "server-only"`) — `listarPacientes` (paginado, búsqueda por nombre/teléfono/ficha, filtro `soloDuplicados`), `obtenerPaciente`, `listarCitasDelPaciente`, `crearPaciente` (marca `possible_duplicate` si el teléfono ya existe, sin bloquear, y devuelve aviso), `editarPaciente` (respeta la marca manual; si el teléfono cambia, reevalúa el duplicado), `exportarPaciente` (paciente + citas en JSON), `anonimizarPaciente`, `eliminarPaciente` (solo si no tiene citas; si las tiene sugiere anonimizar)
- `src/actions/pacientes.ts` — 7 Server Actions, todas con `exigirSesion()`
- Sin migración nueva: `patients` ya tenía todos los campos y RLS de owner

### Rutas del panel
- `/panel-psicologa/pacientes` — listado con TablaPaginada (ficha, nombre enlazada, teléfono, email, badge "Revisar" si `possible_duplicate`), filtros de búsqueda y "solo posibles duplicados", alta/edición con `PacienteModal`, baja con ConfirmarModal. Alta nueva navega a la ficha
- `/panel-psicologa/pacientes/[id]` — ficha con el id UUID (nunca el teléfono): datos completos, consentimiento registrado, citas del paciente, botones Editar, Exportar datos (JSON descargable), Anonimizar y Eliminar (ambos con ConfirmarModal de dos pasos)
- `src/components/panel/PacienteModal.tsx` — crear/editar: nombre y teléfono obligatorios; email, fecha de nacimiento, género (opcional, sin filtro en el listado), dirección y notas opcionales; en edición, checkbox de "posible duplicado" para marcar/desmarcar tras revisar

### Buscador de pacientes en CitaModal
- El `<select>` de paciente se sustituyó por un buscador (combobox): filtra en cliente por nombre (sin distinguir mayúsculas ni acentos), teléfono o número de ficha (máx. 8 resultados), con opción "Crear «nombre» como nuevo paciente" que precarga el formulario inline (flujo ya existente de crear paciente + cita a la vez)

### Decisiones FASE 7
- **Anonimizar** conserva la ficha y las citas: nombre → "Paciente P-00XX", teléfono → "000000000" (cumple el CHECK de solo dígitos), resto de datos personales a NULL; `consent_at`/`consent_version` se conservan como traza del consentimiento
- **Eliminar** solo es posible sin citas asociadas (el FK es `ON DELETE RESTRICT`); con citas el mensaje invita a anonimizar
- **Exportar** genera en el navegador un JSON con la ficha completa y las citas (incluye motivo de las citas: es la exportación de datos del paciente que permite el derecho de acceso)
- **Sin estado activo/pausado** para pacientes (no hace falta: el directorio + búsqueda cubren el caso; anotado aquí como decisión de diseño)
- El género se guarda como dato opcional en la ficha, pero **no hay filtro de género** en el listado (regla de diseño de AGENTS.md)

## Historias clínicas (FASE 8)

### Servicio y Server Actions
- `src/services/historias.ts` (`import "server-only"`) — `listarPacientesHistorial` (pacientes con nº de sesiones y última sesión, búsqueda por nombre/ficha), `listarHistoriaPaciente` (sesiones desc + archivos por sesión), `crearSesionHistoria` y `editarSesionHistoria` (sanitizan con DOMPurify y guardan `session_date` como mediodía local de la psicóloga vía `instanteDesdeLocal`), `borrarSesionHistoria` (borra también los archivos del storage), `subirArchivoHistoria` (valida tipo permitido, tamaño ≤15 MB y tipo real por magic bytes; nombre de archivo UUID bajo `uid/pacienteId/`), `borrarArchivoHistoria`, `urlFirmadaArchivo` (URL firmada de 60 s)
- `src/actions/historias.ts` — 7 Server Actions, todas con `exigirSesion()`

### Rutas del panel
- `/panel-psicologa/historias` — listado de pacientes con TablaPaginada (ficha, nombre, nº de sesiones, última sesión), búsqueda por nombre/ficha y enlace a la historia
- `/panel-psicologa/historias/[id]` — línea de tiempo de notas (fecha dd/mm/aaaa, contenido HTML saneado con `dangerouslySetInnerHTML` + `sanitizarHtml`, archivos adjuntos con nombre/tamaño/tipo), botones Nueva nota, Editar, Eliminar (ConfirmarModal), adjuntar archivos por nota y abrirlos con URL firmada en pestaña nueva. Botón "Volver" con `router.back()` (con fallback al listado de historias si no hay historial), para poder regresar a la cita de origen al llegar desde Citas/Calendario con `?cita=`. `SesionModal.tsx` con fecha (input date), `EditorWysiwyg` (prop `placeholder` nueva) y selección de archivos con lista previa. Vocabulario unificado: "nota" en toda la interfaz de HC ("Nueva nota", "Editar nota", "Eliminar nota", "Fecha de la nota"); los identificadores internos (`ses-*`, `SesionHistoria`) no cambian
- Enlace "Ver historia clínica" y botón "Nueva nota" (`?nueva=1`) desde la ficha del paciente (`PacienteDetalle.tsx`) — el botón "Nueva nota" navega a la historia abriendo el `SesionModal` con el selector de cita

### Decisiones FASE 8
- **Ruta de storage**: la política `owner_write_clinical_files` exige que el primer segmento de la ruta sea `auth.uid()`, por lo que los archivos se guardan como `uid/pacienteId/uuid.ext` (cumple AGENTS.md: id del paciente en la ruta y nombre UUID). Sin migración nueva: tablas, RLS (`is_owner()` en `clinical_records`/`clinical_files`) y bucket `clinical-files` ya existían desde la FASE 0B
- **Tipo real**: además de `archivo.type`, se comprueban los magic bytes (JPEG/PNG/WebP/PDF) en servidor antes de subir; los nombres originales solo se usan para mostrar (`file_name` saneado), el nombre del objeto en storage siempre lo genera el sistema
- **Fechas de sesión**: `session_date` se guarda como timestamptz a mediodía de la zona horaria de la psicóloga (evita corrimientos con cambios de hora); se muestra con `formatearFecha(iso, timezone)`
- **Sanitizado doble**: DOMPurify al guardar (servicio) y al mostrar (componente), como en el blog
- **Eliminar paciente**: además de no tener citas, ahora tampoco puede tener historias clínicas (el borrado en cascada destruiría datos clínicos); el texto del ConfirmarModal lo indica y la alternativa sigue siendo anonimizar
- **Exportar paciente** (FASE 7, ampliado): el JSON incluye ahora las sesiones de la historia (fecha, contenido HTML y nombres/tamaños de los adjuntos, sin rutas internas)
- **`bodySizeLimit`** subido de 6 MB a 16 MB en `next.config.ts` para admitir archivos clínicos de hasta 15 MB
- El borrado de una sesión o archivo borra primero el objeto del storage y luego la fila; si el storage falla, no se borra la fila

## Enlace citas ↔ historias clínicas (FASE 8B)

### Base de datos
- Migración **010** (aplicada): `clinical_records.appointment_id` nullable con `ON DELETE SET NULL` + índice simple; su índice único parcial (una nota por cita) se quitó con la **011** (aplicada) tras la decisión 2026-10-18 de permitir **varias notas por cita**. RLS sin cambios (`is_owner()` ya cubre la tabla)
- Ajuste de código 2026-10-18 (varias notas): `validarCitaParaNota` ya no rechaza "Ya existe una nota para esa cita" (solo comprueba que la cita existe y pertenece al paciente); `listarCitasParaNota` devuelve **todas** las citas del paciente, pasadas y futuras (sin filtro de nota previa ni embed `clinical_records`); `SesionModal` y la acción correspondientes sin `excluirRecordId`

### Servicio (`src/services/historias.ts`)
- `crearSesionHistoria`/`editarSesionHistoria` aceptan `appointmentId` opcional; con `validarCitaParaNota` se comprueba en servidor que la cita existe y pertenece al mismo paciente (una misma cita puede repetirse en varias notas)
- `listarCitasParaNota(patientId)`: citas del paciente, pasadas y futuras (todas, límite 50); se quitó el embed `clinical_records`, el filtro de exclusiones y el filtro `.lt("starts_at", now)` que dejaba el selector vacío con citas de hoy/futuras
- `listarHistoriaPaciente` trae `appointment_id` y la cita embebida (`fechaIso`, `finIso`, `modality`) como `citaOrigen` en cada sesión; los embeds se normalizan con `Array.isArray` (PostgREST los devuelve como array)
- `session_date` sigue siendo propio de la nota: se prellena de la cita al elegirla en el modal, pero si luego se mueve o edita la cita, la fecha de la nota no cambia

### Citas (`src/services/citas.ts`)
- `SELECT_CITA` incluye `clinical_records(id)` (array con varias notas posibles) → `notaId` en `CitaFila` toma el primer id del array; el listado y el calendario no muestran contenido clínico, solo el enlace a la nota
- Al editar una cita, si el estado final es `cancelled` y el anterior no lo era, se vacía `appointment_id` de **todas** las notas enlazadas a esa cita (las notas sobreviven con el enlace vacío)
- Borrar una cita vacía el enlace por el FK `ON DELETE SET NULL`
- `crearCita`/`editarCita` solo ejecutan `hayConflicto` cuando el estado final es `scheduled` o `completed` (guardia `ocupaAgenda`), coherente con la restricción `appointments_no_overlap` de la BD; así las citas canceladas/no presentó se pueden mover a huecos "ocupados" por programadas sin falso positivo de solape

### Panel
- `CitaModal`: en citas editadas con estado Completada (o con nota ya enlazada), bloque de enlace "Ver nota en la historia" o "Escribir nota de sesión" (`?cita=<id>`)
- `CitasPanel`: en la columna de acciones, icono de enlace a la historia (ver nota si `notaId`, o escribir si completada sin nota)
- `SesionModal`: selector "Cita de origen (opcional)" con **cualquier** cita del paciente, pasadas y futuras (varias notas por cita permitidas); al elegir cita se prellena la fecha
- `HistoriaPaciente`: badge de cita de origen (fecha, hora, modalidad) en cada sesión; acepta `?cita=` en la URL para abrir el modal de nueva sesión con la cita preseleccionada
- `CalendarioPanel`: las citas canceladas/no presentó ya **no** se pintan con `locked` (podían quedar "cerradas" sin poder moverlas de día/hora); siguen con color neutro para distinguirlas visualmente de las programadas
- `PacienteDetalle` (ficha del paciente): botón "Nueva nota" que navega a `/panel-psicologa/historias/[id]?nueva=1`; `HistoriaPaciente` acepta la prop `abrirNueva` y abre `SesionModal` al montar (mismo patrón que `?cita=`); `page.tsx` de la historia lee el search param `nueva`. Completado el pendiente de la FASE 8

### Reglas de seguridad aplicadas
- Toda acción pasa por Server Actions con `exigirSesion()`; RLS `is_owner()` sin cambios; validación de la cita en servidor (mismo paciente); el contenido clínico no sale del panel (citas muestran solo enlace)

## Protección de datos (FASE 9)

### Servicio y Server Action
- `src/services/proteccion-datos.ts` (`import "server-only"`) — `obtenerPlantillaProteccion` (fila única de `data_protection_template`, HTML saneado; sin fila devuelve vacío con versión "1.0"), `guardarPlantillaProteccion` (valida no vacío y ≤100 000 caracteres, sanea con DOMPurify, upsert de la fila única con versión autoincrementada `X.Y → X.(Y+1)`), `obtenerDatosResponsable` (nombre, colgiado, dirección, teléfono y email públicos de `professional_profile`)
- `src/actions/proteccion-datos.ts` — `guardarPlantillaProteccionAction` con `exigirSesion()`
- `src/lib/plantilla-proteccion.ts` — `PLANTILLA_DEFECTO`: modelo orientativo inicial en español (marcado como "debe adaptarse y hacerse revisar"); vive en `lib` (no en el servicio `server-only`) porque lo usa el componente cliente

### Rutas del panel
- `/panel-psicologa/proteccion-datos` — editor wysiwyg con pestañas Editar/Vista previa (sanitizada), tarjeta de versión actual (se incrementa en cada guardado), botón "Descargar plantilla vacía (PDF)" y tarjeta con los datos del responsable. Si la plantilla está vacía se precarga el modelo orientativo en el editor (sin guardar hasta pulsar "Guardar plantilla") y aparece "Restaurar modelo inicial"
- `/panel-psicologa/proteccion-datos/imprimir` — vista imprimible (servidor con `exigirSesion()`); con `?paciente=<id>` rellena los datos del titular desde la ficha, sin parámetro descarga la plantilla vacía con huecos en blanco; botón "Guardar como PDF" (`window.print()`). Sin librerías de PDF: hoja A4 con `@page` y CSS de impresión, firmas en blanco al pie

### Decisiones FASE 9
- **PDF sin librerías** (según AGENTS.md): vista imprimible + `window.print()` ("Guardar como PDF" del navegador); si no queda bien, se propondrá jsPDF y se pedirá autorización
- **Reglas de impresión globales del panel**: en `panel.module.css`, `@media print` oculta sidebar, header y overlay y quita el padding de `.contenido` (beneficia cualquier impresión desde el panel)
- **Documento**: cabecera (nombre de la psicóloga, título, versión y fecha de emisión en la zona de la psicóloga), bloque "Datos del titular" (relleno con la ficha o líneas en blanco), contenido HTML de la plantilla saneado, pie con el responsable del tratamiento y líneas de firma (persona titular y psicóloga) más fecha a mano
- **Versionado**: cada guardado incrementa la versión (1.0 → 1.1 → …); la tabla solo guarda la fila actual, así que no hay historial de contenidos anteriores (recuperarlos requeriría una migración nueva; anotado por si se pide)
- **Botón en la ficha del paciente**: "PDF protección de datos" abre `/panel-psicologa/proteccion-datos/imprimir?paciente=<id>` en pestaña nueva
- **Sin migración nueva**: `data_protection_template` (fila única, RLS: anon lectura, owner CRUD con `is_owner()`, service_role total) ya existía desde la FASE 0B
- **Seguridad**: Server Action con `exigirSesion()`; HTML sanitizado con DOMPurify al guardar, al servir y al imprimir; la lectura de la plantilla y del perfil pasa por RLS `is_owner()` (el cliente de servidor usa la sesión de la psicóloga); el PDF de un paciente solo se genera con sesión iniciada (ruta bajo `/panel-psicologa`)

## Preguntas frecuentes (FASE 10)

### Servicio y Server Actions
- `src/services/faqs.ts` (`import "server-only"`) — `listarFaqs` (todas las del panel, orden `order_index` + pregunta; la respuesta se sanea con DOMPurify al servir), `crearFaq` (valida pregunta 3–300, respuesta no vacía ≤50 000 caracteres, categoría opcional ≤80; sanea con DOMPurify; `order_index` = máximo + 1), `editarFaq` (misma validación; conserva el orden), `eliminarFaq`, `moverFaq(id, "arriba"|"abajo")` (renumbera posiciones de los dos vecinos, robusto ante empates de orden). Crear/editar/eliminar/mover revalidan `/faq`
- `src/actions/faqs.ts` — 5 Server Actions (`listarFaqsAction`, `crearFaqAction`, `editarFaqAction`, `eliminarFaqAction`, `moverFaqAction`), todas con `exigirSesion()` y validación de tipos de entrada

### Rutas del panel
- `/panel-psicologa/faqs` — lista numerada en orden (posición, pregunta, badge de categoría opcional, badge Visible/Oculta) con acciones subir/bajar (flechas, deshabilitadas en los extremos), editar y eliminar (ConfirmarModal); botón "Nueva pregunta" y EmptyState con la misma acción si no hay ninguna. `FaqModal.tsx`: pregunta, categoría opcional, editor wysiwyg con pestañas Editar/Vista previa (sanitizada) y checkbox "Visible en la web"; el estado se resetea al abrir (patrón de los demás modales)

### Decisiones FASE 10
- **Sin paginación**: las FAQs suelen ser pocas; la lista completa con reordenación por flechas es más intuitiva que una tabla paginada (si crece mucho, se valorará paginar; anotado)
- **Orden con flechas en vez de número editable**: reordenar es un clic y no permite números duplicados; `moverFaq` renumera las dos posiciones afectadas
- **Respuesta en HTML**: la columna `answer_html` usa `EditorWysiwyg` (regla de AGENTS: campos de texto grandes con wysiwyg), saneado con DOMPurify al guardar y al servir, como blog e historias
- **Categoría como texto libre** (no tabla): el campo `category` de `faqs` ya existía como texto opcional; suficiente para agrupar en la web sin CRUD extra (si se pide un CRUD de categorías de FAQ, sería migración nueva)
- **Visibilidad**: `is_active` controla qué FAQs ve `anon` (la política `anon_read_faqs` ya filtra activas desde la FASE 0B); el panel muestra todas con badge
- **Sin migración nueva**: la tabla `faqs`, su RLS (anon lectura de activas, owner CRUD con `is_owner()`, service_role total) y el trigger de `updated_at` ya existían desde la FASE 0B
- **Revalidación**: `/faq` se revalida en cada mutación (la página pública es placeholder hasta la FASE 16, pero el hook queda listo)
- **Seguridad**: Server Actions con `exigirSesion()`; sin datos sensibles; HTML sanitizado en las dos capas (servicio al guardar/servir, modal en la vista previa)

## Información pública y catálogo (FASE 11)

### Servicio y Server Actions
- `src/services/informacion-publica.ts` (`import "server-only"`) — `obtenerInformacionPublica` (datos públicos de `professional_profile`: nombre, eslogan, colegiado, teléfono, email, sobre mí, dirección y lugar de consulta; el HTML del sobre mí se sanea con DOMPurify al servir), `guardarInformacionPublica` (valida nombre 2–150, eslogan ≤200, colegiado ≤50, teléfono ≤30 con símbolos permitidos, email con formato, sobre mí no vacío ≤100 000 caracteres saneado, dirección ≤250, lugar ≤150; actualiza la fila del perfil y revalida la web pública). `src/actions/informacion-publica.ts` — 2 Server Actions con `exigirSesion()`
- `src/services/catalogo-web.ts` (`import "server-only"`) — CRUD genérico para `services` y `specialties` (`TipoCatalogo`, mismos campos) con `listarItems`, `crearItem` (nombre 2–120, descripción ≤600, icono opcional con formato Font Awesome `fa-heart` o `fa-solid fa-heart`, guardado en minúsculas), `editarItem`, `eliminarItem`, `moverItem` (renumbera vecinos); CRUD de `plans` con `listarPlanes`, `crearPlan` (nombre 2–120, descripción ≤600, precios ≥0 ≤99 999,99, características ≤15 líneas × ≤120 caracteres), `editarPlan`, `eliminarPlan`, `moverPlan`. Todas las mutaciones revalidan la web pública
- `src/actions/catalogo-web.ts` — 10 Server Actions con `exigirSesion()` y comprobación de tipo de catálogo
- `src/lib/revalidar-web.ts` — helper `revalidarWebPublica()` que revalida `/`, `/inicio`, `/sobre-mi`, `/servicios`, `/pide-cita` y `/contacto`

### Componentes y rutas
- `src/components/panel/CatalogoSeccion.tsx` + `CatalogoModal.tsx` + `catalogo.module.css` — panel genérico de lista (posición, icono si es servicio, badge Visible/Oculto, flechas subir/bajar, editar, eliminar con ConfirmarModal) y modal (nombre, descripción, icono solo en servicios, checkbox de visibilidad), parametrizado por `tipo`
- `/panel-psicologa/servicios` y `/panel-psicologa/especialidades` — páginas de servidor que cargan los datos y usan `CatalogoSeccion`
- `/panel-psicologa/planes` — `PlanesPanel.tsx` + `PlanModal.tsx` (nombre, descripción, precio online y presencial, características una por línea, visibilidad); precios formateados en euros con `Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" })`
- `/panel-psicologa/informacion-publica` — `InfoPublicaPanel.tsx` con tarjetas (Datos básicos, Contacto público, Sobre mí con editor wysiwyg y pestañas Editar/Vista previa, Dirección y consulta) y lateral con "Guardar cambios", enlace a Disponibilidad (los horarios se configuran allí desde la FASE 4) y enlace a Perfil privado (la foto se gestiona allí desde la FASE 15)

### Decisiones FASE 11
- **Horarios**: ya se configuran en Disponibilidad (FASE 4); Información pública no los duplica, solo enlaza a esa sección
- **Foto de la psicóloga**: no se edita aquí; queda para Perfil privado (FASE 15), donde se gestiona el avatar
- **Sobre mí con wysiwyg**: regla de AGENTS para campos de texto grandes; HTML saneado con DOMPurify al guardar y al servir (el texto plano del asistente se muestra bien; los saltos de línea antiguos no se convierten en `<br>`)
- **Descripciones de catálogo en texto plano**: son campos cortos (≤600 caracteres); el wysiwyg se reserva para contenido largo (blog, FAQs, sobre mí, historias)
- **Servicios y especialidades comparten componente**: mismas columnas (`name`, `description`, `order_index`, `is_active`); un solo `CatalogoSeccion` parametrizado por tipo en lugar de duplicar paneles
- **Iconos**: texto libre con validación de formato Font Awesome en servidor (regex `fa-…`); se previsualiza en la lista con `<i className="fa …">`
- **Precios en euros**: moneda fija EUR con formato es-ES; no es configurable (sin columna; si se pide, migración nueva)
- **Revalidación compartida**: `revalidarWebPublica()` revalida las 6 páginas públicas en cada mutación de perfil o catálogo (hoy son placeholders hasta la FASE 16, pero el hook queda listo)
- **Sin migración nueva**: `professional_profile`, `services`, `specialties` y `plans` con su RLS (anon lectura de activos, owner CRUD con `is_owner()`) ya existían desde la FASE 0B
- **Seguridad**: Server Actions con `exigirSesion()`; validación en servidor de todos los campos; sobre mí sanitizado con DOMPurify en servidor (guardar/servir) y cliente (vista previa); anon solo lee filas activas vía RLS existente

## Temas visuales (FASE 12)

### Índice de temas (`src/themes/index.ts`)
- Módulo seguro para cliente y servidor (sin `server-only`): lo usan el panel, la instalación y el servidor
- `TEMAS`: registro de los 5 temas (id, nombre, descripción y colores de muestra para el panel)
- Temas: `base` (terracota original), `calma` (azules suaves), `naturaleza` (verdes/tierra), `moderno` (teal minimalista), `elegancia` (oscuro con dorado)
- `MODOS_LAYOUT`: `multipage` (por defecto) y `landing`
- Helpers: `esTemaValido()`, `esModoLayoutValido()`

### Estructura de tokens por tema
- `src/themes/<nombre>/tokens.css`: colores del tema con alcance `.tema-<nombre>` (no `:root`, para poder aplicarlos por clase sin pisar el panel)
- `src/themes/base/css/variables.css` conserva los valores en `:root` (FASE 0C, apariencia idéntica del tema base)
- `src/themes/todos-los-temas.css`: importa los tokens de los 5 temas; se carga en la web pública y en la previsualización
- Cada tema redefine el conjunto de variables semánticas de color (primario, fondos, textos, bordes, estados, sombras); tipografía, espaciado y radios son comunes del tema base
- La web pública (`(public)/layout.tsx`) lee `site_settings.active_theme` y envuelve el contenido en `<div class="tema-<nombre>">`; los componentes usan `var(--...)` y el tema cambia automáticamente

### Selector del panel (`/panel-psicologa/temas`)
- `TemasPanel.tsx`: tarjetas de tema con muestras de color (datos del índice, no estilos fijos), guardado inmediato al hacer clic con toast de confirmación, etiqueta "En uso"
- Modo de la web (landing/multipágina) en tarjetas al lado, mismo patrón
- Previsualización en pestaña nueva: `/preview-tema/<id>` (fuera del shell del panel, protegida por `exigirSesion()` en la página) con header, hero, servicios y contacto usando los datos reales del perfil y las variables del tema
- Botón "¿Quieres un diseño personalizado? Pídelo aquí" → https://victorroblesweb.es/contacto
- Servicio `src/services/temas.ts` (`obtenerConfigTema`/`guardarConfigTema`, valida contra el índice y revalida la web pública) + 2 Server Actions con `exigirSesion()`
- El asistente de instalación (`PasoTema.tsx`) consume el mismo `TEMAS` del índice (lista única)

### Decisiones
- `active_theme` SIN CHECK en BD (plug and play: añadir un tema es una carpeta nueva + una línea en el índice, sin migración); se valida en servidor contra el índice
- Migración **012**: CHECK de `layout_mode` (`landing`/`multipage`) en site_settings
- Los componentes React por tema (secciones de la web) llegarán en la FASE 16; ahora cada tema es su carpeta de tokens y el índice

## Imágenes del sitio (FASE 13)

### Huecos (catálogo en código: `src/services/imagenes.ts` → `HUECOS_IMAGEN`)
- 8 huecos con id, nombre, descripción e imagen de stock: `hero`, `sobre-mi`, `servicios`, `especialidades`, `cita`, `contacto`, `blog`, `faq`
- Tabla `site_images` (PK `placeholder`, `image_path`, `alt_text`): si hay fila con `image_path`, esa imagen tiene prioridad sobre la de stock
- `obtenerImagenHueco(placeholder)`: helper listo para la FASE 16 (devuelve la URL personalizada o la stock)

### Panel `/panel-psicologa/imagenes`
- Rejilla de tarjetas con vista previa (`next/image`), badge "Tu imagen" / "De ejemplo", botones "Subir/Cambiar imagen" y "Usar la de ejemplo" (con ConfirmarModal)
- Subida: input de archivo oculto por tarjeta; validación en cliente y servidor (jpg/png/webp, ≤5 MB); ruta UUID en `public-images/imagenes/`; al cambiar se borra el archivo anterior; revalida la web pública
- Servicio `src/services/imagenes.ts` + 3 Server Actions con `exigirSesion()`

### next/image
- `next.config.ts` con `images.remotePatterns` hacia el hostname de `NEXT_PUBLIC_SUPABASE_URL` (pathname `/storage/v1/object/public/**`), para poder usar `next/image` con las URLs de Storage

### Decisiones
- Catálogo de huecos en código (no en BD): añadir un hueco es editar `HUECOS_IMAGEN`; sin migración
- `alt_text` se rellena con el nombre del hueco al subir; editable directamente en la tabla si se necesita (sin UI dedicada por ahora)
- Sin migración nueva (tabla y RLS de `site_images` ya existían desde la FASE 0B)

## Tema del panel y secciones (FASE 14)

### Preferencias del panel (tema claro/oscuro + color principal)
- Constantes y validaciones en `src/lib/panel-tema.ts` (compartido cliente/servidor): `ModoPanel` (`light`/`dark`), `COLORES_PANEL` (8 colores con nombre: Azul `#2563eb` por defecto, Verde menta, Lavanda, Rosa, Terracota, Índigo, Verde bosque, Ámbar), `esModoPanel()`, `esColorPanel()`, nombre de cookie `psicocms-preferencias-panel`
- Tabla `dashboard_preferences` (PK `user_id`): `theme_mode` + `primary_color`; RLS ya existente (`is_owner() AND user_id = auth.uid()`)
- Flujo sin parpadeo: el layout de `/panel-psicologa` lee la cookie (y si no existe, `obtenerPreferencias()` de BD) y pasa `preferencias` a `PanelShell`, que las aplica en el div raíz (`data-modo-panel` + `--color-primario` inline)
- Botón del header (luna/sol) → `TemaPanelModal`: modo Claro/Oscuro + 8 colores; "Guardar tema" → `guardarPreferenciasAction` (`exigirSesion()`, valida en servidor, upsert en BD y escribe la cookie con `maxAge` de 1 año)
- Servicio `src/services/preferencias.ts`: lectura con fallback a valores por defecto y escritura

### Modo oscuro (CSS)
- Paleta en `panel.module.css`: `.shell[data-modo-panel="dark"]` redefine `--color-fondo`, `--color-fondo-alt`, `--color-app`, `--color-texto`, `--color-texto-suave`, `--color-borde`, colores de alerta y `color-scheme: dark`; el alcance es el panel, la web pública no cambia
- Derivados del primario con `color-mix()` en `.shell[data-modo-panel]` (`--color-primario-oscuro`/`--color-primario-claro`); en oscuro `--color-primario-claro` = primario 25% + blanco
- `globals.css`: bordes y textos de `.alerta--*` son ahora variables (`--color-*-borde`, `--color-*-texto`); los valores claros son idénticos a los anteriores
- `@media print` restaura la paleta clara cuando el panel está en oscuro (PDF con `window.print()` de la FASE 9) y `body:has(.shell[data-modo-panel="dark"])` pone el fondo del documento en oscuro

### Secciones activables de la web
- Claves (lista blanca en `src/lib/panel-tema.ts` → `SECCIONES_WEB`): `booking`, `services`, `specialties`, `plans`, `blog`, `faq`; clave ausente = activada
- Guardadas en `site_settings.sections_enabled` (jsonb, RLS `is_owner()` ya existente); servicio `src/services/secciones.ts` (`parsearSecciones()`, `guardarSecciones()` con revalidación de la web pública) + Server Action `guardarSeccionesAction` con `exigirSesion()`
- Página `/panel-psicologa/secciones` (menú Gestión web): filas con icono, nombre, descripción, estado Visible/Oculta e interruptor; guardado inmediato con toast
- Consumo en la web pública: el layout `(public)` lee las secciones con `obtenerSecciones()` y solo muestra los enlaces del menú activos; `/servicios`, `/blog`, `/faq` y `/pide-cita` devuelven 404 (`notFound()`) si su sección está desactivada (helper `seccionActivaPublica()`), fix posterior a la FASE 14

### Decisiones
- Migración **013** (aplicada): CHECK de `dashboard_preferences.primary_color` con los 8 colores; la misma validación se hace en el servidor
- La cookie es solo un atajo de lectura (`httpOnly`, `secure` en producción, `sameSite=lax`); la BD es la fuente de verdad
- Sin funciones RPC nuevas ni tablas nuevas; RLS existente sin cambios

## Configuraciones y extras del panel (FASE 15)

### Frases públicas
- Servicio `src/services/frases.ts` (lectura, `GRUPOS_FRASES` para agrupar por zona del panel, `guardarFrases` con límite de 1000 caracteres por frase) + Server Action `guardarFrasesAction` con `exigirSesion()`
- Página `/panel-psicologa/frases` (menú Gestión web) con buscador, edición inline por grupos y botón global "Guardar" con contador de cambios sin guardar

### Redes sociales
- `src/lib/redes.ts`: **módulo compartido cliente/servidor (sin `server-only`)** con `REDES_DISPONIBLES` (iconos FA), tipos y `opcionRed` — los componentes cliente solo pueden importar *tipos* de módulos `server-only`, por eso los valores viven en `src/lib/`
- Servicio `src/services/redes.ts` (CRUD + orden + interruptor de visibilidad, valida URL http/https) + 5 Server Actions con `exigirSesion()`
- Página `/panel-psicologa/redes-sociales` con tarjetas por red (interruptor, flechas de orden, Modal de edición, ConfirmarModal de borrado)

### Email y notificaciones (nodemailer)
- Servicio `src/services/email.ts`: `obtenerConfigEmail`/`guardarConfigEmail` **solo con cliente admin** (`service_role`; los grants por columnas de la migración 014 impiden leer `smtp_password_encrypted` con sesión), `enviarEmail` y `enviarEmailPrueba`
- Contraseña de Gmail cifrada en el servidor con **AES-256-GCM** (clave derivada de `SUPABASE_SERVICE_ROLE_KEY` con sha256, formato `v1:iv:tag:ct`); nunca vuelve al frontend (la interfaz solo muestra `hasPassword` → "•••• (contraseña guardada)")
- Un único campo "Email de Gmail" alimenta `smtp_user` y `from_email`; SMTP avanzado (host/puerto) oculto en un `<details>`; mini tutorial de Gmail con enlaces a myaccount.google.com/security y /apppasswords + botón "Enviar email de prueba"
- Página `/panel-psicologa/email-notificaciones`; Server Actions `guardarConfigEmailAction` y `enviarEmailPruebaAction` con `exigirSesion()`

### Perfil privado
- Servicio `src/services/perfil-privado.ts` (`obtenerPerfilPrivado`, `obtenerCabeceraUsuario`, `obtenerEstadoMfa`, `guardarPerfilPrivado` con validación de nombre 2–150 y teléfono 5–30 con símbolos, `subirAvatar`/`quitarAvatar` en bucket `avatars` ≤2 MB jpg/png/webp con nombre UUID, `cambiarEmailAcceso` que verifica la contraseña con `signInWithPassword` y luego `admin.updateUserById({ email, email_confirm: true })`) + 4 Server Actions en `src/actions/perfil.ts`
- Página `/panel-psicologa/perfil` con 4 tarjetas: Tus datos (nombre + `phone_private`), Foto de perfil (cambiar/quitar con ConfirmarModal), Email y contraseña de acceso (cambios sensibles con contraseña actual) y Verificación en dos pasos
- **Decisión:** `professional_profile` NO tiene `email_private`: el email de acceso es el email de Supabase Auth (fuente única de verdad). El login usa `phone_private` si existe, si no `phone_public` (migración 014)

### Verificación en dos pasos (TOTP con Supabase MFA)
- Server Actions en `src/actions/mfa.ts`: `iniciarMfaAction` (enroll TOTP, devuelve `qr_code` como data-URI — sin librería QR — y secreto para entrada manual; limpia factores pendientes previos), `activarMfaAction` (challenge + verify), `desactivarMfaAction` (unenroll) y `verificarCodigoMfaAction` (durante el login). Rate limits con `checkRateLimit`: `mfa-enroll:`/`mfa:`/`mfa-login:` 5 intentos / 15 min
- `loginAction` devuelve `mfaRequerido` sin cerrar la sesión de primer factor; `/acceso-psicologa` pasa a un segundo "paso" (formulario de 6 dígitos, detecta `?mfa=pendiente` con `window.location.search` en un `useEffect` para evitar el wrapper de Suspense de `searchParams`)
- `exigirSesion()` y `getSesionOPcional()` rechazan sesiones `aal1` con `nextLevel === "aal2"` → redirect a `/acceso-psicologa?mfa=pendiente`; el `middleware` redirige igual para `/panel-psicologa/*` pero **permite quedarse en `/acceso-psicologa`** con MFA pendiente (evita bucle de redirects)
- **Recuperación si se pierde la app de autenticación:** en servidor con `service_role` → `supabase.auth.admin.listFactors(userId)` + `supabase.auth.admin.unenroll({ userId, factorId })`; queda documentado aquí y en la propia página del perfil. Se recomienda anotar el factor al activarlo
- `professional_profile` NO gana campos nuevos para el TOTP (los factores viven en Supabase Auth)

### Política de privacidad
- **Migración 015:** tabla `privacy_policy` (fila única `id boolean`, `content_html`, `version`, `updated_at`, trigger `update_updated_at_column`), RLS: `anon` SELECT, `authenticated` con `is_owner()`, `service_role` total; grants explícitos; texto base orientativo (seed)
- Servicio `src/services/politica-privacidad.ts` (espejo de `proteccion-datos.ts`: DOMPurify al guardar y al servir, versión autoincrementada `x.y`) + Server Action `guardarPoliticaPrivacidadAction` con `exigirSesion()` que además llama a `revalidarWebPublica()`
- Panel `/panel-psicologa/politica-privacidad` (menú Configuración) con `EditorWysiwyg`, pestañas Editar/Vista previa sanitizada, tarjeta de versión/fecha y enlace "Ver página pública"
- Página pública `/politica-privacidad` con `generateMetadata` y HTML saneado (clase `.prosa` nueva en `publico.module.css`); **footer público enlaza** a la política desde la FASE 15
- Enlace a la política desde el formulario de reserva (FASE 17): hecho; el formulario lee `consent_version` de esta tabla y la envía a `create_public_booking`

### Buscador general
- Servicio `src/services/busqueda.ts`: 5 grupos (pacientes por nombre/teléfono/ficha, citas por motivo o por pacientes encontrados, notas de sesión por contenido con fragmento de texto, artículos por título/slug, FAQs por pregunta); límite 8 por grupo; sanea `,()` del texto por el parser `.or()` de PostgREST (patrón del resto del proyecto)
- Página `/panel-psicologa/buscar?q=…` (server component, `exigirSesion()`) con resultados agrupados y enlaces directos a la ficha/historia/artículo; EmptyState si no hay resultados
- Cabecera del panel: `<form>` de búsqueda en `PanelShell` que navega a `/panel-psicologa/buscar?q=`

### Ayuda con tutorial
- `/panel-psicologa/ayuda` (antes placeholder): tutorial en texto, en español y con tuteo, en 9 tarjetas (primeros pasos, citas y calendario, disponibilidad, pacientes, historias clínicas, contenido de la web, reservas y avisos, cuenta y seguridad, buscar y ayuda) + consejos; solo servidor, sin interactividad

### Cabecera del panel (nueva)
- Botón de usuario (avatar o iniciales + nombre + chevron) con desplegable: "Perfil privado" y "Cerrar sesión" (sustituye al botón suelto de logout); se cierra al pulsar fuera o al cambiar de ruta
- El pie del menú lateral (avatar + nombre + email) ahora es un enlace a `/panel-psicologa/perfil`
- Responsive: nombre del usuario oculto ≤900 px, título del header oculto ≤620 px

### Migraciones 014 y 015 (aplicadas)
- **014 `014_perfil_privado_email_settings.sql`:** `professional_profile.phone_private` (text, CHECK de formato 5–30 con símbolos), `verify_login_phone` recreada (prefiere `phone_private`, cae a `phone_public`, mismos grants que antes) y `email_settings` con grants por columnas: `authenticated` solo ve las columnas no secretas; `INSERT/UPDATE/DELETE` revocados a `anon` y `authenticated` (escrituras solo vía admin client en Server Action)
- **015 `015_privacy_policy.sql`:** tabla `privacy_policy` + trigger + RLS + grants + seed (ver arriba)

### Reglas de seguridad aplicadas (checklist psicocms-seguridad)
- Toda Server Action de la fase (frases, redes, email, perfil, MFA, política) llama a `exigirSesion()` (getUser en servidor); `verificarCodigoMfaAction` usa `getUser()` directamente porque trabaja sobre la sesión aal1 (donde `exigirSesion` redirigiría)
- `service_role` solo en `src/lib/supabase/admin.ts` (`server-only`); la contraseña SMTP cifrada solo viaja servidor ↔ servidor
- Contraseña actual obligatoria para cambiar email y contraseña; contraseña mínima de 12 caracteres (ya existente); mensajes de error genéricos en login
- TOTP como segundo factor real (el teléfono público no lo es); límite de intentos por usuario con `check_rate_limit` (solo `service_role`)
- Bucket `avatars` con validación de tipo real y tamaño en servidor, nombres UUID
- Todo HTML de editores (política, vista previa) saneado con DOMPurify antes de `dangerouslySetInnerHTML`
- Sin datos personales en logs ni en mensajes de error; el buscador solo consulta con sesión iniciada

## Parte pública (FASE 16)

### Componentes compartidos (`src/components/publico/`)
- **Decisión:** los componentes de la web pública viven en `src/components/publico/` y usan solo `var(--...)` del tema activo; no se duplican por tema. Cambiar el tema cambia la apariencia sin tocar componentes (mismo plugguening que los tokens de la FASE 12).
- `secciones.tsx`: `Hero`, `SobreMi`, `Servicios`, `Especialidades`, `Planes`, `Faq` (acordeón nativo `<details>`), `CtaCita`, `Contacto` (con mapa embebido de Google Maps por dirección) y `VacioPublico`
- `botones-contacto.tsx`: `BotonesContacto` (cita / llamar / WhatsApp / email); WhatsApp con `wa.me/` + dígitos del teléfono público
- `publico-secciones.module.css`: estilos de secciones; `publico.module.css` del layout: header sticky, modo landing (smooth scroll + `scroll-margin-top`)

### Servicios de lectura pública
- `src/services/textos-web.ts`: mapa de frases públicas con valores por defecto (`obtenerTextosWeb`, `texto`, `formatearPrecio`, `enlaceWhatsApp`, `enlaceLlamada`, `enlaceEmail`)
- `src/services/blog-publico.ts`: `listarArticulosPublicos` (con paginación y filtro por categoría), `contarArticulosPublicos`, `obtenerArticuloPublicoPorSlug`, `listarCategoriasPublicas` (refuerza filtros del RLS por si la dueña visita la web con sesión abierta)
- El RLS de anon ya filtra `is_active`/`published`; las páginas filtran además en servidor

### Layout público (`src/app/(public)/layout.tsx`)
- Logo = nombre real de la psicóloga + eslogan; menú según secciones activas y modo de la web
- Modo **landing**: enlaces del menú a anclas (`/#sobre-mi`, `/#servicios`, `/#pide-cita`, `/#contacto`); el Blog siempre en `/blog` (listado dinámico)
- Modo **multipágina**: enlaces a rutas; `/` redirige a `/inicio`; en landing, `/inicio` redirige a `/#inicio`
- JSON-LD `ProfessionalService` en el layout; `generateMetadata` con título por defecto/plantilla
- Footer con nombre, derechos, política de privacidad y redes sociales activas (`listarRedesActivas`, iconos FA, abren en pestaña nueva)

### Páginas
- `/`: landing completa (hero, sobre mí, servicios, especialidades, planes, FAQ, CTA y contacto con mapa) o redirect a `/inicio`
- `/inicio`, `/sobre-mi`, `/servicios`, `/faq`, `/contacto`: secciones con datos reales; 404 si la sección está desactivada
- `/pide-cita`: título + empty state del formulario (llega en FASE 17) + contacto con mapa
- `/blog` y `/blog/[slug]`: listado paginado con filtro por categorías, y artículo con HTML saneado (DOMPurify)

### SEO (`src/lib/seo.ts`)
- `urlBase()`/`urlAbsoluta()` con `NEXT_PUBLIC_URL` (fallback localhost); `metadatosPublicos()` (canonical, Open Graph, Twitter) y `jsonLd()` (escapa `<`)
- `src/app/sitemap.ts`: páginas según secciones activas + artículos publicados; se revalida con la web
- `src/app/robots.ts`: permite `/`, deniega `/panel-psicologa`, `/acceso-psicologa`, `/instalacion`, `/preview-tema`, `/api`
- `revalidarWebPublica()` revalida también `/`, `/blog/[slug]` y `/sitemap.xml`

### Decisiones FASE 16
- **Mapa:** iframe embebido de Google Maps (`maps?q=<dirección>&output=embed`), sin API key; si no hay dirección, no se muestra
- **WhatsApp:** dígitos del `phone_public` (sin `+` ni espacios); el número debe incluir prefijo de país para que funcione
- **FAQ sin JS:** `<details>/<summary>` con icono FA vía CSS
- **Imágenes:** `next/image` con `obtenerImagenHueco()` (personalizada o stock)
- **Fuentes:** se reutilizan las del layout raíz (`--font-panel` Lexend, `--font-marca` Castoro)
- **Blog básico en FASE 16:** listado + detalle para no dejar la ruta hueca; FASE 18 completa paginación, filtro y pie con redes
- Sin migraciones nuevas; sin Server Actions nuevas (solo lectura anónima vía RLS existente)

### Reglas de seguridad aplicadas
- Solo lectura anónima de contenido público ya permitido por RLS (003); se refuerza filtrando en servidor por si la sesión es de la dueña
- HTML de artículos y FAQ saneado con DOMPurify antes de `dangerouslySetInnerHTML`
- Sin datos personales de pacientes en ninguna página pública; sin `service_role`; sin nuevas acciones mutantes
- `robots.txt` y `disallow` de rutas privadas del panel

## Reservas públicas (FASE 17)

### Flujo
- El visitante abre `/pide-cita` → elijo online/presencial → calendario con huecos reales (`get_available_slots` vía `service_role` en la Server Action) → nombre, teléfono (solo números), email y motivo opcionales → casilla de política de privacidad → `crearReservaAction` → `create_public_booking` (solo `service_role`) → confirmación con enlace a Google Calendar.
- Si la sección de reservas está desactivada, `/pide-cita` devuelve 404 (ya existente).

### Módulos nuevos
- `src/services/reservas.ts` (`import "server-only"`) — `obtenerHuecosPublicos` (RPC `get_available_slots` con admin client; filtra `available`; 60 días desde hoy en zona de la psicóloga), `crearReservaPublica` (valida nombre 2–100, teléfono 6–15 dígitos, email, motivo ≤500, modalidad, fecha/hora y consentimiento; calcula `ends_at` = inicio + duración de sesión; llama a `create_public_booking`; traduce errores de la RPC a mensajes genéricos; si se reutiliza una ficha existente actualiza `consent_at`/`consent_version`; envía email de aviso en segundo plano sin romper la reserva)
- `src/actions/reservas.ts` — `obtenerHuecosAction(modality)`, `obtenerVersionPoliticaAction()`, `crearReservaAction(formData)`. Honeypot en campo oculto `website`; rate limits con `check_rate_limit` (IP 5/hora, teléfono 3/hora); respuesta genérica de error; sin `exigirSesion` (ruta pública)
- `src/lib/google-calendar.ts` — `enlaceGoogleCalendar()` (url plantilla, fechas en UTC `AAAAMMDDTHHMMSSZ`; sin motivo ni datos de salud)
- `src/components/publico/formulario-reserva.tsx` + `formulario-reserva.module.css` — selector de modalidad, calendario mensual propio (sin librerías; marca días con huecos), horas del día elegido, formulario con honeypot, consentimiento enlazado a `/politica-privacidad`, estado de carga y confirmación con botón Google Calendar

### Datos de entrada
- El formulario envía `fecha` (YYYY-MM-DD) y `hora` (HH:MM) en zona local de la psicóloga; el servidor convierte con `instanteDesdeLocal` + timezone de `site_settings`
- La duración de la cita se obtiene de `professional_profile` por modalidad; el RPC exige que `ends_at - starts_at` sea exactamente la sesión (no sesión+descanso)

### Email de aviso
- Destinatario: `email_settings.from_email` (el email de Gmail configurado en el panel)
- Contenido: solo nombre, fecha, hora y modalidad; **sin** motivo ni datos de salud
- Se envía con `void` (no await destructivo): si falla, la reserva ya está creada
- Requiere que las notificaciones estén activadas y exista contraseña de aplicación (FASE 15)

### Decisiones FASE 17
- **Sin captcha** (solo honeypot): AGENTS permite honeypot o captcha; el honeypot no requiere servicios externos ni autorización extra
- **Calendario propio sin librerías**: rejilla mensual HTML/CSS; Calendar.js se reserva para el panel (FASE 5)
- **Límites**: IP 5 reservas/hora y teléfono 3/hora en `rate_limit_events`; el RPC ya limita a 3 citas futuras activas por teléfono y modalidad
- **Sin migración nueva**: `get_available_slots`, `create_public_booking`, `check_rate_limit` y los grants ya existían (004, 004c, 007, 008, 009)
- **RPC quién puede ejecutar** (sin cambios): `get_available_slots` → authenticated, service_role (la Server Action usa service_role; el navegador nunca la llama); `create_public_booking` → solo service_role; `check_rate_limit` → solo service_role

### Reglas de seguridad aplicadas
- Reserva solo vía Server Action; el navegador no toca Supabase
- `service_role` solo en `src/services/reservas.ts` (server-only) y en el admin client
- Honeypot + rate limit IP/teléfono + máximo de citas futuras (RPC)
- Validación en servidor de longitudes, teléfono y fecha; revalidación de disponibilidad dentro de `create_public_booking`
- Respuesta pública genérica: no revela si el teléfono existía ni datos del paciente
- Casilla de privacidad obligatoria; se guarda `consent_at` y `consent_version` (nueva ficha o actualización al reutilizar)
- Email sin motivo de consulta; fallo del email no revierte la reserva
- Sin datos personales en logs

## Blog público y redes (FASE 18)

### Listado y filtro de `/blog`
- Paginación por `searchParams` (`?page=N`, 9 artículos por página) y filtro por categoría (`?categoria=<slug>`); los links de categoría reinician a la página 1
- `listarArticulosPublicos(limite, { desplazamiento, categoriaSlug })` con `.range()` y `.eq("category.slug", ...)`; `contarArticulosPublicos(categoriaSlug)` con count exacto
- Chips de categorías ("Todas" + activas); empty state específico si la categoría no tiene artículos
- Título del `h1` = nombre de la categoría activa o "Blog"; paginación con Anterior/Siguiente (iconos FA) y "Página N / M"
- Textos configurables: `blog.all_categories`, `blog.no_posts_category`, `blog.prev`, `blog.next`, `blog.page_of`

### Redes sociales en el footer
- `listarRedesActivas()` en `src/services/redes.ts` (filtra `is_active = true` también en servidor, por si la dueña visita con sesión)
- Footer del layout público: lista de iconos FA (`red.icon`), enlace `target="_blank" rel="noopener noreferrer"`, `aria-label` con el nombre de la red (`opcionRed`)
- Estilos en `publico.module.css`: círculos con borde, hover con color primario

### Decisiones FASE 18
- **9 artículos por página** (múltiplo de 3 para la rejilla de 3 columnas)
- **Filtro por query string** (`?categoria=`) en vez de ruta `/blog/categoria/[slug]`: más simple y el sitemap ya lista artículos sueltos
- **Sin migraciones nuevas:** `social_links` y `blog_categories` ya existían con RLS de anon (003)
- **Sin Server Actions nuevas:** solo lectura anónima vía RLS existente; revalidación de `/blog` ya existía (FASE 16)
- **RPC quién puede ejecutar** (sin cambios): ninguna nueva en esta fase

### Reglas de seguridad aplicadas
- Solo lectura anónima de contenido público ya permitido por RLS (003); se refuerza filtrando `is_active` y `status: published` en servidor
- Sin datos personales; sin `service_role`; sin acciones mutantes nuevas

## Seguridad y despliegue (FASE 19)

### Cabeceras de seguridad (`next.config.ts`)
- `headers()` en `next.config.ts` aplica a `/(.*)`:
  - CSP: `default-src 'self'`; `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (payloads RSC de App Router); `style-src 'self' 'unsafe-inline'`; `img-src`/`connect-src` con el hostname real de Supabase (+ `wss://` para Realtime); `frame-src` solo Google Maps; `frame-ancestors 'none'`; `worker-src 'self' blob:`; `object-src 'none'`; `base-uri`/`form-action` `'self'`
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`: camera/microphone/geolocation/payment/usb/interest-cohort desactivados
  - HSTS (`max-age=63072000; includeSubDomains; preload`) **solo en producción** (`NODE_ENV=production`)

### `proxy.ts` (antes `middleware.ts`)
- Next 16.4.1: el nombre oficial es `proxy.ts` con `export async function proxy`; matcher y lógica de protección de `/panel-psicologa/*` sin cambios

### Auditoría de seguridad (código, 2026-10-21)
| Área | Resultado |
|------|-----------|
| RLS | Todas las políticas `authenticated` usan `is_owner()`; `anon` solo lee contenido público (servicios, FAQ, blog publicado, frases, redes, imágenes, plantilla protección, política de privacidad). `anon` NO accede a `patients`, `appointments`, `clinical_*`, `email_settings` ni datos privados del perfil |
| RPC | `create_public_booking` y `check_rate_limit` solo `service_role` (004b/004c/007); `verify_login_phone` solo `authenticated` + `service_role` con `is_owner()`; `get_available_slots` solo `authenticated` + `service_role`; `is_setup_completed` también `anon` (sin datos personales); `EXECUTE` revocado a `PUBLIC` en todas |
| Storage | `clinical-files` privado (solo dueña + service_role); URLs firmadas de 60 s; nombres UUID; validación de tipo real y tamaño en servidor |
| Server Actions del panel | Todas usan `exigirSesion()` (`getUser` en servidor); el middleware/proxy es capa adicional, no la única |
| Reserva pública | Solo Server Action → RPC con `service_role`; honeypot + rate limit IP/teléfono + máximo de citas futuras; respuesta genérica; email sin motivo |
| Claves | `service_role` solo en `src/lib/supabase/admin.ts` (`server-only`); sin prefijo `NEXT_PUBLIC_`; nunca en componentes de cliente |
| Login | Rate limit por IP real (`x-forwarded-for`/`x-real-ip`) 5/15 min y por email 3/15 min; mensajes genéricos; MFA TOTP opcional |
| Contraseña Gmail | Cifrada AES-256-GCM; solo service_role la lee; grants por columnas (014) |
| Logs | Solo `console.warn/error` genéricos en rate-limit e instalación; sin datos personales ni de salud |

### `npm audit` (2026-10-21)
- **5 vulnerabilidades "high"** en `braces` vía cadena `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`
- Son dependencias de **desarrollo** (ESLint); **no** se incluyen en el bundle de producción ni en el runtime de Vercel
- El fix automático (`npm audit fix --force`) instalaría `eslint-config-next@14.2.35` (degradación mayor); **no se aplica**
- Riesgo residual: DoS por patrones muy anidados al ejecutar ESLint localmente sobre entradas no confiables — no aplica al CMS en uso real

### Pasos manuales pendientes (usuario)
1. **Prueba de abuso de reservas**: con el sitio desplegado, enviar muchas reservas seguidas desde la misma IP y con el mismo teléfono; deben bloquearse a partir de 5/h (IP) y 3/h (teléfono). También probar llamando `create_public_booking` con la anon key desde el navegador: debe fallar (solo `service_role`)
2. **Región de Supabase**: confirmar en el dashboard de Supabase que el proyecto está en **eu-west-1** (Frankfurt, UE) o anotar la región real si es otra; influye en la normativa aplicable (RGPD)
3. **Política de conservación de datos** (revisar con asesoramiento legal; el sistema solo la aplica técnicamente):
   - Datos de pacientes y historias clínicas: se conservan mientras exista relación terapéutica y los plazos legales de la normativa sanitaria/LOPD aplicable; la psicóloga puede exportarlos o anonimizarlos desde la ficha (derechos de acceso, supresión y portabilidad)
   - `rate_limit_events`: se pueden purgar periódicamente (son temporales)
   - Copias de seguridad: revisar el plan de Supabase (PITR o backups diarios según plan); si no bastan para datos clínicos, exportar `patients`, `appointments` y `clinical_records` periódicamente (pg_dump o panel → Exportar)
4. **Copias de seguridad en Supabase**: en Database → Backups, comprobar el plan activo y la retención; si es el plan gratuito (snapshots diarios, retención limitada), valorar un plan de pago o un volcado programado
5. **Despliegue en Vercel**:
   - Importar el repo; Node 20.19+ (ideal 22+ o 24 LTS)
   - Variables de entorno en Vercel (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INSTALL_TOKEN` (≥32 caracteres), `NEXT_PUBLIC_URL=https://tudominio.com`
   - **Nunca** poner `SUPABASE_SERVICE_ROLE_KEY` con prefijo `NEXT_PUBLIC_`
6. **Dominio y URLs en Supabase Auth**: en Authentication → URL Configuration, añadir `https://tudominio.com` y `https://tudominio.com/acceso-psicologa` a Site URL y Redirect URLs (recuperación de contraseña)
7. **Prueba final del flujo**: instalación (si no está hecha) → login con los 3 datos → reserva pública → email de aviso → nota de sesión en la historia → comprobar cabeceras de seguridad en el navegador (DevTools → Network)

### Reglas de seguridad aplicadas (FASE 19)
- Cabeceras de seguridad en todas las respuestas (CSP, frame-ancestors, HSTS en prod)
- `service_role` solo en servidor; rate limit de login con IP real
- Auditoría completa de RLS/RPC/storage/actions sin hallazgos críticos en el código
- Sin migraciones nuevas

## Historial de cambios

- 2026-10-21: FASE 19 completada (implementación; pasos manuales abajo) - Seguridad y despliegue: (1) **Cabeceras de seguridad** en `next.config.ts` (`headers()`): CSP (default/script/style/img/connect/frame-src/worker-src adaptadas a Supabase y Google Maps), `frame-ancestors 'none'` + `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y HSTS solo en producción. (2) **`middleware.ts` → `proxy.ts`** con `export async function proxy` (Next 16). (3) **Rate limit de login por IP real**: `loginAction` lee `x-forwarded-for`/`x-real-ip` (antes usaba `'unknown'` fijo). (4) **URL del sitio unificada**: `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_URL` en recuperación de contraseña. (5) **Auditoría de seguridad** (RLS, RPC, storage, Server Actions, claves): todas las políticas `authenticated` usan `is_owner()`; anon solo lee contenido público; `create_public_booking` y `check_rate_limit` solo `service_role`; contraseña SMTP ilegible desde cliente (grants por columnas 014); admin client con `server-only`; `exigirSesion()` en todas las acciones del panel. (6) `npm audit`: 5 vulnerabilidades high en `braces` vía `eslint-config-next` (solo dependencias de desarrollo/eslint, **no** en el runtime de producción; corregir requeriría degradar eslint-config-next a 14.x). Sin migraciones nuevas. `npm run build` exitoso (49 páginas). Skills usadas: psicocms-seguridad.
- 2026-10-21: FASE 18 completada - Blog público y redes en el footer: `/blog` con paginación (`?page=`, 9/página), filtro por categorías (`?categoria=slug`, chips con "Todas"), empty state específico por categoría y `h1` según categoría activa; servicio `blog-publico.ts` con `listarArticulosPublicos` (offset + filtro embed) y `contarArticulosPublicos`; footer del layout público con redes activas (`listarRedesActivas` filtra `is_active` también en servidor, iconos FA, abren en pestaña nueva con `rel="noopener noreferrer"`); textos configurables (`blog.all_categories`, `blog.no_posts_category`, `blog.prev/next/page_of`); estilos de chips y paginación en `blog.module.css` y de redes en `publico.module.css`. Sin migraciones nuevas (tablas y RLS ya existían). `npm run build` exitoso (49 páginas). Skills usadas: psicocms-textos.
- 2026-10-20: FASE 17 completada - Reservas públicas en `/pide-cita`: selector online/presencial, calendario mensual propio con huecos reales (`get_available_slots` vía service_role), formulario (nombre, teléfono solo números, email y motivo opcionales), honeypot, rate limits IP (5/h) y teléfono (3/h), máximo de citas futuras en el RPC, casilla de política de privacidad con `consent_at`/`consent_version`, creación con `create_public_booking` (solo service_role), confirmación con enlace a Google Calendar (sin APIs) y email de aviso a la psicóloga (solo nombre/fecha/hora/modalidad; el fallo del email no rompe la reserva). Módulos: `src/services/reservas.ts`, `src/actions/reservas.ts`, `src/lib/google-calendar.ts`, `src/components/publico/formulario-reserva.tsx` + CSS. Sin migraciones nuevas. `npm run build` exitoso (49 páginas). Skills usadas: psicocms-citas, psicocms-seguridad, local-dates, psicocms-textos.
- 2026-10-20: FASE 16 completada - Parte pública: componentes compartidos en `src/components/publico/` con solo `var(--...)` (Hero, SobreMi, Servicios, Especialidades, Planes, Faq, CtaCita, Contacto con mapa, VacioPublico, BotonesContacto con WhatsApp `wa.me`); layout público con logo real (nombre + eslogan), menú según secciones y modo (landing con anclas `/#...`, multipágina con rutas; blog siempre en `/blog`), JSON-LD `ProfessionalService`, footer con política de privacidad. Páginas `/` (landing completa o redirect a `/inicio`), `/inicio`, `/sobre-mi`, `/servicios`, `/faq` (acordeón `<details>`), `/contacto`, `/pide-cita` (empty state hasta FASE 17 + contacto con mapa), `/blog` y `/blog/[slug]` (HTML saneado; paginación/categorías → FASE 18). SEO: `src/lib/seo.ts` (`NEXT_PUBLIC_URL`, canonical/OG/Twitter, `jsonLd`), `sitemap.ts` y `robots.ts`, `revalidarWebPublica` con `/`, `/blog/[slug]` y `/sitemap.xml`. Servicios de lectura: `textos-web.ts` y `blog-publico.ts` (refuerza filtros del RLS por sesión de la dueña). Sin migraciones nuevas. `NEXT_PUBLIC_URL` añadida a `.env.example`. `npm run build` exitoso (49 páginas). Skills usadas: psicocms-temas, psicocms-textos, psicocms-seguridad.
- 2026-10-20: FASE 15 completada - Configuraciones y extras del panel: frases públicas editables (`/frases` con grupos, buscador y guardado global) y redes sociales (`/redes-sociales` con CRUD, orden e interruptores; valores compartidos en `src/lib/redes.ts` porque los componentes cliente no pueden importar módulos `server-only`); email y notificaciones con nodemailer (un solo campo "Email de Gmail", contraseña SMTP cifrada AES-256-GCM en servidor, mini tutorial de Google, email de prueba; escrituras con admin client por los nuevos grants por columnas de `email_settings`); perfil privado (`/perfil`: nombre, `phone_private`, avatar en bucket `avatars` ≤2 MB, email de acceso y contraseña con contraseña actual en cambios sensibles) con botón de usuario en el header (desplegable Perfil privado / Cerrar sesión) y pie del menú lateral enlazado al perfil; verificación en dos pasos TOTP con Supabase MFA (enroll con QR data-URI, challenge/verify, desactivar; `loginAction` devuelve `mfaRequerido`, paso de código en `/acceso-psicologa`, `exigirSesion`/middleware redirigen a `?mfa=pendiente` sin bucles, rate limits 5/15 min, recuperación documentada con `admin.unenroll`); política de privacidad editable y versionada (panel + página pública `/politica-privacidad` con `generateMetadata` + enlace en el footer); buscador general en la cabecera con página de resultados agrupados (`/buscar?q=`); ayuda con tutorial completo (9 secciones). Migraciones **014** (`phone_private` + `verify_login_phone` preferente + grants por columnas de `email_settings`) y **015** (`privacy_policy` con RLS anon/owner/service_role y seed) creadas y **pendientes de aplicar** (junto a la 013). Enlace de la política desde el formulario de reserva → FASE 17. `npm run build` exitoso (47 páginas). Skills usadas: psicocms-seguridad, psicocms-textos.


- 2026-10-20: Fix FASE 14 (pendiente de `fixes.md` resuelto) - Las secciones ocultadas en el panel seguían viéndose en la web pública porque el layout `(public)` no leía `site_settings.sections_enabled`. Ahora el menú público filtra Servicios/Blog/FAQ/Pide cita con `obtenerSecciones()`; las páginas `/servicios`, `/blog`, `/faq` y `/pide-cita` devuelven 404 con `notFound()` si su sección está desactivada (nuevo helper `seccionActivaPublica()` en `src/services/secciones.ts`); `revalidarWebPublica()` pasa a revalidar también `/blog` y `/faq`. Lectura anónima válida por la política `anon_read_site_settings`; sin migraciones ni cambios de permisos. `npm run build` exitoso (44 páginas). Skill aplicada: psicocms-seguridad.
- 2026-10-20: FASE 14 completada - Tema del panel y secciones activables: botón de tema en el header (luna/sol) que abre `TemaPanelModal` con modo Claro/Oscuro y 8 colores principales (el azul actual entre ellos), guardado con `guardarPreferenciasAction` (Server Action con `exigirSesion()`) en `dashboard_preferences` + cookie `psicocms-preferencias-panel` (httpOnly, 1 año) que el layout lee en servidor para aplicar el tema sin parpadeo. Constantes/validaciones en `src/lib/panel-tema.ts`, servicios `preferencias.ts` y `secciones.ts`. Paleta oscura completa por variables en `.shell[data-modo-panel="dark"]` (tokens, alertas como variables nuevas en `globals.css`, `color-scheme` y `color-mix()` para los derivados del primario), con `@media print` que restaura el claro para los PDF de la FASE 9. Nueva página `/panel-psicologa/secciones` (Gestión web) con interruptores para booking, servicios, especialidades, planes, blog y FAQs, guardando `site_settings.sections_enabled` con lista blanca y revalidando la web pública. Migración **013** (pendiente de aplicar): CHECK de `primary_color`. `npm run build` exitoso (45 páginas). Skills usadas: psicocms-seguridad, psicocms-textos.
- 2026-10-20: FASE 13 completada - Imágenes del sitio: catálogo de 8 huecos (`hero`, `sobre-mi`, `servicios`, `especialidades`, `cita`, `contacto`, `blog`, `faq`) en `src/services/imagenes.ts` con su imagen de stock; la tabla `site_images` da prioridad a la imagen personalizada. Panel `/panel-psicologa/imagenes` con rejilla de tarjetas (vista previa `next/image`, badge "Tu imagen"/"De ejemplo"), subida con validación jpg/png/webp ≤5 MB en cliente y servidor, ruta UUID en `public-images/imagenes/`, borrado del archivo anterior y "Usar la de ejemplo" con ConfirmarModal. Helper `obtenerImagenHueco()` listo para los temas (FASE 16). `next.config.ts` con `images.remotePatterns` hacia el hostname de Supabase para `next/image`. Servicio + 3 Server Actions con `exigirSesion()`; sin migraciones (tabla y RLS ya existían). `npm run build` exitoso (44 páginas). Skills usadas: psicocms-seguridad, psicocms-textos.
- 2026-10-20: FASE 12 completada - Temas visuales: índice único de temas en `src/themes/index.ts` (5 temas con id/nombre/descripción/conjunto de colores de muestra, seguro para cliente y servidor) consumido por el panel y por el asistente de instalación. 5 carpetas de tema con `tokens.css` con alcance `.tema-<nombre>` (base, calma, naturaleza, moderno, elegancia) + `todos-los-temas.css`; la web pública envuelve el contenido en `tema-<activo>` leyendo `site_settings`, así que cambiar el tema cambia la apariencia completa. Panel `/panel-psicologa/temas`: tarjetas de tema con muestras y guardado inmediato (toast), formato landing/multipágina en tarjetas, previsualización en pestaña nueva `/preview-tema/<id>` (fuera del shell del panel, protegida por `exigirSesion()`, con datos reales del perfil y servicios) y botón de diseño personalizado → victorroblesweb.es/contacto. Servicio `temas.ts` con validación contra el índice + 2 Server Actions con `exigirSesion()`; revalidación de la web pública al guardar. Migración **012** (pendiente de aplicar): CHECK de `layout_mode`; `active_theme` queda sin CHECK para ser plug and play (decisión anotada). `npm run build` exitoso (44 páginas). Skills usadas: psicocms-temas, psicocms-seguridad, psicocms-textos.
- 2026-10-20: Fix HC (pendiente de `fixes.md` resuelto) - Los botones de añadir nota de `HistoriaPaciente.tsx` (cabecera y estado vacío) pasan de "Nueva nota" a "Agregar nota", según lo pedido. Título del modal sin cambios. Sin migraciones. `npm run build` exitoso.
- 2026-10-20: FASE 11 completada - Información pública y catálogo: `/panel-psicologa/informacion-publica` con edición de los datos públicos del perfil (nombre, eslogan, colegiado, teléfono, email, sobre mí con `EditorWysiwyg` y pestañas Editar/Vista previa sanitizada, dirección y lugar de consulta), enlaces laterales a Disponibilidad (horarios) y Perfil privado (foto). CRUD completo de servicios y especialidades con panel compartido `CatalogoSeccion`/`CatalogoModal` (orden con flechas, visibilidad, icono Font Awesome en servicios con validación de formato) y de planes (`PlanesPanel` con precios online/presencial en euros y características por líneas). Servicios `informacion-publica.ts` y `catalogo-web.ts` con validación en servidor; 12 Server Actions con `exigirSesion()`; helper `src/lib/revalidar-web.ts` que revalida las 6 páginas públicas en cada mutación. Sin migraciones (tablas y RLS ya existían). `npm run build` exitoso (43 páginas). Skills usadas: psicocms-seguridad, psicocms-textos.
- 2026-10-20: FASE 10 completada - Preguntas frecuentes: `/panel-psicologa/faqs` con CRUD completo (crear, editar, eliminar con ConfirmarModal, reordenar con flechas subir/bajar) e interruptor de visibilidad "Visible en la web". Respuesta con `EditorWysiwyg` (pestañas Editar/Vista previa sanitizada) y categoría opcional de texto libre. Servicio `src/services/faqs.ts` (validación + DOMPurify + revalidación de `/faq`) y 5 Server Actions con `exigirSesion()`. Lista numerada sin paginación (decisión anotada) y EmptyState con acción. Sin migraciones (tabla y RLS ya existían). `npm run build` exitoso (43 páginas). Skills usadas: psicocms-seguridad, psicocms-textos.
- 2026-10-20: FASE 9 completada - Protección de datos: `/panel-psicologa/proteccion-datos` con editor wysiwyg (Jodit, pestañas Editar/Vista previa sanitizada), guardado con `guardarPlantillaProteccionAction` (Server Action con `exigirSesion()`, HTML saneado con DOMPurify, versión autoincrementada en la fila única `data_protection_template`) y modelo orientativo inicial (`src/lib/plantilla-proteccion.ts`, marcado para adaptar y revisar). `/panel-psicologa/proteccion-datos/imprimir`: vista imprimible A4 sin librerías (`window.print()` → "Guardar como PDF"), plantilla vacía con huecos en blanco o rellena con los datos del paciente (`?paciente=<id>`, botón nuevo "PDF protección de datos" en la ficha), cabecera con versión/fecha y pie con responsable + firmas. Reglas `@media print` en `panel.module.css` para ocultar el chrome del panel al imprimir. Sin migraciones (tabla y RLS ya existían). `npm run build` exitoso (43 páginas). Skills usadas: psicocms-seguridad, psicocms-textos.
- 2026-10-19: Fixes de HC (pendientes de `fixes.md`) - (1) **No se podía volver a la cita desde HC**: el enlace "Volver" de `HistoriaPaciente.tsx` era un `Link` fijo al listado de historias; pasa a ser un `<button>` con `router.back()` (fallback `/panel-psicologa/historias`), de modo que desde Citas o Calendario con `?cita=` se regresa a la pantalla de origen. CSS `.volver` con reset de botón. (2) **Vocabulario unificado en HC**: textos visibles de `HistoriaPaciente.tsx` y `SesionModal.tsx` ("Nueva sesión" → "Nueva nota", "Editar sesión" → "Editar nota", "Eliminar sesión" → "Eliminar nota", mensajes y etiquetas de campo), según el vocabulario de AGENTS.md ("cita" = agendado, "nota" = clínico); identificadores internos sin cambios. Sin migraciones. `npm run build` exitoso (42 páginas). Skills usadas: psicocms-textos.
- 2026-10-19: FASE 8 completada (pendiente final) - Botón "Nueva nota" en la ficha del paciente (`PacienteDetalle.tsx`) que navega a `/panel-psicologa/historias/[id]?nueva=1`; `page.tsx` de la historia lee el search param `nueva` y `HistoriaPaciente` lo convierte en `abrirNueva` para abrir `SesionModal` al montar (selector de cita incluido, mismo patrón que `?cita=`). Sin migración, sin cambios de RLS ni de servicios: solo 3 ficheros de UI. `npm run build` exitoso. Skills usadas: psicocms-citas, psicocms-seguridad, psicocms-textos. Migración **011** aplicada por la usuaria el mismo día.
- 2026-10-18: Fixes de citas e historias (pendientes de `fixes.md`) - (1) **No se podían escribir notas desde las citas / combobox vacío**: `listarCitasParaNota` en `src/services/historias.ts` filtraba `.lt("starts_at", now)`, solo citas ya empezadas; con citas de hoy/futuras el selector salía vacío aunque `citaId` llegara preseleccionado por `?cita=`. Se elimina el filtro → devuelve todas las citas del paciente (pasadas y futuras, orden desc, límite 50). (2) **Citas completadas/canceladas/no presentó "cerradas"**: `aEvento` en `CalendarioPanel.tsx` marcaba `locked: finalizada` (bloqueaba el arrastre de canceladas/no presentó) y `crearCita`/`editarCita` ejecutaban `hayConflicto` incondicionalmente, aunque la restricción `appointments_no_overlap` (migración 009) solo cuenta `scheduled`/`completed` como ocupantes. Se retira `locked` (color neutro se conserva) y se añade la guardia `ocupaAgenda` para solo chequear conflicto en estados que ocupan agenda. Nota: programar citas en el pasado sigue bloqueado por diseño. Sin migraciones. `npm run build` exitoso (42 páginas). Skills usadas: psicocms-citas.
- 2026-10-18: "Una cita puede tener varias notas" implementada - Nueva migración **011** (pendiente de aplicar) que elimina `idx_clinical_records_appointment_unique`. `src/services/historias.ts`: `validarCitaParaNota` ya no rechaza notas duplicadas por cita; `listarCitasParaNota(patientId)` devuelve todas las citas pasadas (sin embed de notas ni `excluirRecordId`). `SesionModal` y la Server Action actualizados (deps del effect sin `excluirRecordId`). Además fix de `/debug-login` por la actualización de supabase-js a 2.109.0 (`generateLink` ahora devuelve `data.properties.action_link`). `npm run build` exitoso (42 páginas). Skills usadas: psicocms-seguridad, psicocms-citas.
- 2026-10-18: Fusión del kit actualizado - AGENTS.md nuevo (v2) y skills actualizadas; `plan-implementacion.md` regenerado con la estructura nueva (estados de cita en FASE 4, FASE 8B integrada en FASE 8) y marcas [x] según el código real (sin marcar: fuentes WOFF2, imágenes WebP, botón "Nueva nota" en ficha de paciente y tutorial de ayuda). Decisiones nuevas en el MAP: cita vs nota de sesión con sus 4 estados, **una cita podrá tener varias notas** (ajustar migración 010 y `src/services/historias.ts` antes de aplicar la 010), `middleware.ts` → `proxy.ts` pendiente (Next 16.4.1) y `/debug-login` como ruta de desarrollo sin documentar. Diferencias AGENTS vs código detalladas para el usuario. Sin cambios de código ni de BD en esta tarea.
- 2026-10-16: FASE 8B completada - Enlace opcional citas ↔ historias clínicas. Migración **010** creada (pendiente de aplicar): `clinical_records.appointment_id` nullable con `ON DELETE SET NULL` + índice único parcial (una nota por cita). Servicio de historias: validación en servidor de la cita (mismo paciente, sin nota previa), `listarCitasParaNota`, `session_date` propio de la nota. Citas: `notaId` vía embed `clinical_records(id)` en `SELECT_CITA`, desenlace al cancelar en servidor. Panel: selector "Cita de origen" en `SesionModal`, badge de cita de origen en cada sesión, "Escribir nota de sesión"/"Ver nota" en `CitaModal` y en el listado de citas (sin contenido clínico en citas). `npm run build` exitoso.
- 2026-10-16: Fix pegar cita en hueco libre daba falso positivo de ocupado - Calendar.js al pegar (`Yh`) solo cambia la fecha del evento copiado y conserva su hora original, así que un evento copiado de las 09:00 se pegaba a las 09:00 en el día clicado y, si a esa hora había cita, saltaba el toast de ocupado aunque el hueco clicado estuviera libre. Listener de `contextmenu` en fase capture (necesario porque `C(a)` hace `preventDefault`+`cancelBubble`) que guarda en `clicDerechoRef` la hora/minuto del clic en la celda de semana o el área de día, y `onEventAdded` recalcula el rango pegado (`inicio.setHours(clic.hora, clic.min)`, `fin = inicio + duración`) antes de `solapaOcupada`: hueco libre → `CitaModal` con la hora del clic; ocupado → toast sin modal. Verificado en navegador real (página temporal `/debug-cal` ya eliminada): pegar en libre → modal con hora del clic sin toast; pegar en ocupado → toast correcto; doble clic sin regresión; 0 errores de consola. Nota: el navegador automatizado de pruebas corría en `America/Buenos_Aires` mientras las citas usaban `+02:00`, lo que desalineaba `solapaOcupada` solo en el test; en producción la zona del navegador coincide con la configurada. Sin migraciones ni cambios de datos/permisos. `npm run build` exitoso.
- 2026-10-14: FASE 0A completada - Proyecto Next.js inicializado, estructura de rutas, clientes Supabase, middleware, variables de entorno, build exitoso, primer commit.
- 2026-10-14: FASE 0B completada - Base de datos creada con 22 tablas, RLS, 6 funciones RPC, 3 buckets Storage, tipos TypeScript generados, seed data aplicado.
- 2026-10-14: FASE 0C completada - Recursos visuales preparados: variables semánticas, Font Awesome ligero, fuentes copiadas (pendiente WOFF2), imágenes de stock listadas para verificación de licencias, tokens de panel extraídos, build verificado.
- 2026-10-15: FASE 1 completada - Asistente de instalación en `/instalacion` con 5 pasos: conexión, datos de acceso, información profesional, foto, tema. Server Action `instalar` con cliente admin, validación de `INSTALL_TOKEN`, creación de usuario en Auth, perfil profesional, site_settings, servicios, especialidades, planes, disponibilidad. Barra de progreso, modo landing/multipágina, 5 temas disponibles. `npm run build` exitoso.
- 2026-10-15: FASE 2 completada - Login seguro en `/acceso-psicologa` con email, teléfono y contraseña (mín. 12 chars). Server Action `loginAction` con `@supabase/ssr`, verificación de teléfono via RPC `verify_login_phone`, rate limiting por IP y email, mensaje de error genérico. Opción "Mantener sesión iniciada" con cookies persistentes. Recuperación de contraseña con respuesta idéntica. Logout vía API. Header del panel muestra usuario y botón "Cerrar sesión". `npm run build` exitoso.
- 2026-10-15: Corrección de estilos pre-FASE 3 (opción A del usuario) - Las páginas de instalación, acceso, panel y públicas usaban clases Tailwind sin Tailwind instalado (HTML crudo). Reescritura con CSS Modules + clases UI base en `globals.css`. Token de instalación ahora validado en el paso 1 (trim + `/api/instalacion/verificar-conexion`), eliminados h1 duplicados y botón final duplicado, Font Awesome enlazado (`css/all.min.css` + `webfonts/`), emojis sustituidos por iconos FA, `alert()` eliminado del login, sidebar responsive con hamburguesa. Detalle completo en `fixes.md`. `npm run build` exitoso. Pendiente: migración 007 y `npm install` para reparar ESLint.
- 2026-10-15: FASE 3 completada - Layout del panel refactorizado (servidor verifica sesión y pasa datos de usuario; `PanelShell` cliente con menú y header). Menú reorganizado con acceso directo a Citas, Calendario, Pacientes, Historias y Disponibilidad, y desplegables para Gestión web y Configuración. Componentes reutilizables creados: Modal, ConfirmarModal (dos pasos), Toast, EmptyState, TablaPaginada, Campo. Patrón de sesión en `src/lib/auth-guard.ts` y ejemplo de servicio en `src/services/dashboard.ts`. Páginas placeholder para las 20 secciones del menú. Home consume el servicio con datos de prueba. `npm run build` exitoso (41 páginas).
- 2026-10-15: FASE 4 completada - Inicio con estadísticas y listas reales. Disponibilidad: duración/descanso por modalidad con aviso al cambiarlos, rejilla semanal de 7 días marcable con clic por modalidad, modo vacaciones y periodos de vacaciones lado a lado. Citas: listado paginado con filtros, alta/edición/borrado, paciente existente o creación inline con aviso de teléfono repetido, validación de solapamiento y descanso en servidor más restricción de exclusión en BD. Utilidades de fechas en `src/lib/fechas.ts` (zona IANA, dd/mm/aaaa, 24 h, semana desde lunes). Migración **008** creada (timezone + corrección de duración en RPC con guardas de envolución 24:00). `npm run build` exitoso (41 páginas). Pendiente: aplicar migraciones 007 y 008; `npm install` para reparar ESLint.
- 2026-10-15: Fix solapamiento entre modalidades - Las citas de modalidades distintas podían pisarse en las 4 capas (constraint con `modality WITH =`, `hayConflicto`, `get_available_slots`, `create_public_booking`). Creada la migración **009** (constraint sin distinción de modalidad + diagnóstico previo que detiene la migración si hay solapes existentes + ambas RPC corregidas; el límite de citas futuras por teléfono sigue por modalidad) y actualizado `hayConflicto` en `src/services/citas.ts` (misma modalidad con ventana de paso + cualquier modalidad por solape de rangos). Documentado en AGENTS.md, plan-implementacion.md, MAP.md y fixes.md. `npm run build` exitoso (41 páginas). Pendiente: aplicar migraciones 007, 008 y 009.
- 2026-10-15: FASE 5 completada - Calendario de citas en `/panel-psicologa/calendario` con Calendar.js (npm `jcalendar.js`, servido desde `public/vendor/calendarjs/` y cargado solo en cliente con loader propio y tipos mínimos). Vista mes/semana/día en español (traducción oficial fusionada en las opciones), semana desde lunes. Clic en cita abre el modal de edición; arrastrar y soltar mueve la cita persistiendo con `editarCitaAction` (con reversión y toast si el servidor rechaza el movimiento o si se cambia la duración fija de la sesión). Modal de cita extraído a `src/components/panel/CitaModal.tsx` y reutilizado por Citas y Calendario. Nuevos helpers de fechas "wall-clock" (`fechaLocalDePartes`/`partesDeFechaLocal`). Sin migraciones nuevas. `npm run build` exitoso (41 páginas). Pendiente: aplicar migraciones 007, 008 y 009; `npm install` para reparar ESLint.
- 2026-10-16: Fix calendario FASE 5 (citas no pintadas) - `sincronizar()` añadía los eventos con `addEvents(eventos, false, false)` y borraba con `clearEvents(false, false)`: en Calendar.js v2.12.6 esos parámetros controlan el repintado del DOM (por defecto `true`), así que las citas se guardaban en datos pero nunca se renderizaban en mes/semana/día. Ahora `clearEvents(true, false)` + `addEvents(eventos, true, false)`. Además las opciones (incluida la traducción española) se construían antes de cargar los scripts, por lo que el calendario salía en inglés; ahora `opcionesConEspañol()` se aplica tras cargar `calendar.min.js` y `translations/calendar.translations.es.js`. Solo UI (`CalendarioPanel.tsx`), sin migraciones ni cambios de datos/permisos. `npm run build` exitoso (42 páginas).
- 2026-10-16: FASE 6 completada - Blog del panel en `/panel-psicologa/blog`: CRUD de artículos con editor wysiwyg `jodit-react` (solo cliente, en español), imagen destacada subida a `public-images` (validada en servidor, nombre UUID, ruta `blog/`) y categorías CRUD en modal. Páginas de creación/edición en `/panel-psicologa/blog/articulos/nuevo` y `/[id]` con pestañas Editar/Vista previa. HTML saneado con DOMPurify al guardar, al servir y en la vista previa (`src/lib/sanitizar.ts`). Server Actions y servicios con `exigirSesion()`; sin migraciones nuevas (tablas y RLS ya existían). Node actualizado de v20.17.0 a v24.20.0 (jsdom/isomorphic-dompurify exigen ≥20.19). `npm run build` exitoso (42 páginas). Migraciones 007, 008 y 009 confirmadas como aplicadas por la usuaria.
- 2026-10-16: Fixes de la usuaria - (1) Blog: subida de imagen destacada atascada en "Subiendo" (Next limita Server Actions a 1 MB por defecto); `next.config.ts` con `bodySizeLimit: "6mb"`, `try/catch/finally` en `ArticuloForm.tsx` y validación client-side de tipo/tamaño. (2) Calendario/Citas: se podían crear citas en fecha pasada con estado Programada; `crearCita`/`editarCita` rechazan `scheduled` en pasado (permiten registrar sesiones pasadas como Completada/No presentó/Cancelada) y `CitaModal.tsx` valida en cliente con `min` de fecha al crear. (3) Pendiente de "calendario no pinta citas" verificado como residuo (jsdom: el repintado con `clearEvents(true,false)`/`addEvents(eventos,true,false)` funciona). Sin migraciones. Detalle en `fixes.md`. `npm run build` exitoso (42 páginas).
- 2026-10-16: Fix calendario "no pinta las citas" (causa raíz) - Verificado en navegador real que `window.calendarJs(...)` de Calendar.js v2.12.6 construye el calendario pero **devuelve `undefined`** (`var q = this` y sin `return` en la fuente: la API de la instancia queda en `window`), por lo que `instanciaRef.current` era `undefined` y `sincronizar()` salía en silencio sin pintar nada (ni la carga inicial ni tras crear una cita). Nuevo `crearInstanciaCalendarJs()` en `src/lib/calendarjs-loader.ts` (envoltorio con los métodos de `window`), `CalendarioPanel.tsx` lo usa en el `.then()` con `errorCarga` si falla, y `src/types/calendarjs.d.ts` tipa `calendarJs` como `→ void`. Página temporal de diagnóstico `src/app/debug-cal/` creada y eliminada tras verificar (5/5 eventos pintados con IDs reales). Solo UI/librería, sin migraciones ni cambios de datos/permisos. `npm run build` exitoso.
- 2026-10-16: Fix calendario doble clic en hueco libre - Al doble clic en un espacio libre Calendar.js creaba un evento de plantilla `* Nuevo evento` (su función `td()` lo añade al calendario) que quedaba pintado sin poder editarlo, en lugar de abrir la interfaz de nueva cita. Ahora `onBeforeEventAddEdit` detecta que el evento no es una cita del mapa, lo elimina con `removeEvent` (nuevo en el envoltorio de `src/lib/calendarjs-loader.ts` y en el tipo `InstanciaCalendarJs`) y abre `CitaModal` precargado con la fecha/hora del hueco (nuevo prop opcional `inicial` en `CitaModal`; el botón "Nueva cita" sigue abriendo con hoy y hora vacía). Subtítulo del calendario actualizado. Verificado en navegador real con página temporal `/debug-cal` (ya eliminada): sin evento fantasma, sin editor interno de Calendar.js, modal "Nueva cita" con la fecha del hueco y 09:00, clic en cita → "Editar cita", 0 errores de consola. Solo UI/librería, sin migraciones ni cambios de datos/permisos. `npm run build` exitoso. Re-verificado tras el reporte "sigue el problema": doble clic real de ratón en mes/semana/día, en celda vacía y en celda con cita, dentro del contexto real del panel (`PanelShell`): el modal se abre visible con fecha/hora correctas en todos los casos (0 errores de consola); si en una pestaña abierta seguía fallando, recargar con Ctrl+Shift+R (código antiguo en caché).
- 2026-10-16: Fix calendario pegar en horario ocupado - El copiar/pegar de Calendar.js (rama de copia: addEvent directo, sin onBeforeEventAddEdit) permitia pegar una cita en una franja ya ocupada y dejaba un evento fantasma no guardado. Nuevo callback onEventAdded en CalendarioPanel.tsx (y en src/types/calendarjs.d.ts): si el evento no es una cita del mapa se elimina en un microtask (la plantilla del doble clic se distingue con plantillaGestionadaRef); si solapa con otra cita activa (scheduled/completed, cualquier modalidad) toast "No se puede pegar ahi: ese horario ya esta ocupado"; si no solapa abre CitaModal precargado con fecha/hora del pegado. Verificado en navegador real con menus contextuales reales (pagina temporal /debug-cal ya eliminada): pegado en dia ocupado bloqueado con toast y sin fantasma, pegado en dia libre abre modal precargado, doble clic sin regresion, 0 errores de consola. Sin migraciones ni cambios de datos/permisos. npm run build exitoso.
- 2026-10-16: Fix calendario completo en pantalla sin scroll - El calendario de la FASE 5 obligaba a scrolear la pagina para verlo entero. Causa doble: (1) `body` sin `margin: 0` en globals.css (8px por lado de margen UA = 16px de scroll permanente en todo el panel; el reset del tema base ya lo tenia pero no llegaba al panel); (2) `.calendarioContenedor > div` forzaba `min-height: 64rem` y `.pagina` calculaba mal la altura util (`calc(100dvh - 11.2rem)`, cuando el chrome vertical real es header 6.4rem + padding de `.contenido` 3.2rem x 2 = 12.8rem). Correccion solo CSS: `body { margin: 0 }` en globals.css; en `src/app/panel-psicologa/calendario/calendario.module.css`, `.pagina` con altura exacta `calc(100vh/dvh - 12.8rem)`, `.cabecera` con `flex: none` y `.calendarioContenedor` en flex con `flex: 1; min-height: 26rem; display: flex; overflow: hidden` (div interior `flex: 1; min-height: 0`, sin `min-height: 64rem`). Con altura real en el contenedor, Calendar.js activa su modo `fixed-height` (vista mes en flex, rejilla llena el contenedor). Verificado en navegador real (720px, pagina temporal /debug-cal ya eliminada): sin scroll de pagina en mes/semana/dia (720=720), calendario dentro del viewport, doble clic sigue abriendo "Nueva cita" (sin regresion), 0 errores de consola. Sin migraciones ni cambios de datos/permisos. `npm run build` exitoso.
- 2026-10-16: FASE 7 completada - Gestión de pacientes en `/panel-psicologa/pacientes`: listado paginado con búsqueda (nombre/teléfono/ficha) y filtro de posibles duplicados, alta y edición con `PacienteModal` (nombre y teléfono obligatorios; email, nacimiento, género, dirección y notas opcionales), ficha en `/panel-psicologa/pacientes/[id]` (URL con UUID) con exportación de datos en JSON, anonimización y borrado con confirmación de dos pasos (borrar solo sin citas; anonimizar conserva las citas sin datos personales). Teléfono duplicado: aviso sin bloquear + marca `possible_duplicate` revisable. Buscador de pacientes en `CitaModal` (sustituye al select; filtra por nombre sin acentos, teléfono o ficha y permite crear paciente + cita a la vez). Sin migraciones (el esquema y RLS de `patients` ya existían). `npm run build` exitoso (44 páginas).
- 2026-10-16: FASE 8 completada - Historias clínicas en `/panel-psicologa/historias`: listado de pacientes con nº de sesiones y última sesión, y detalle en `/panel-psicologa/historias/[id]` con línea de tiempo de sesiones (fecha local de la psicóloga a mediodía), editor wysiwyg (`EditorWysiwyg` con nueva prop `placeholder`), sanitizado con DOMPurify al guardar y al mostrar, y adjuntos de fotos/PDF al bucket privado `clinical-files` (validación en servidor de tipo permitido, ≤15 MB y magic bytes; ruta `uid/pacienteId/uuid.ext` por la política del bucket; apertura con URLs firmadas de 60 s). Borrado de sesión/archivo primero en storage y luego en BD. `exportarPaciente` incluye las sesiones; `eliminarPaciente` ahora también bloquea con historias (usar anonimizar). `bodySizeLimit` de 6 MB a 16 MB. Sin migraciones (tablas, RLS y bucket ya existían). `npm run build` exitoso (45 páginas).
