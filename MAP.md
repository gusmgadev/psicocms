# MAP del proyecto: PsicoCMS

> Fuente de verdad del estado real. Si el código y este mapa no coinciden, gana el código y se corrige el mapa.
> Estado inicial: proyecto sin iniciar. Todo lo marcado como (planificado) aún no existe.

## Estado actual
- Fase en curso: FASE 9 (siguiente: FASE 9)
- Última fase completada: FASE 8B

## Stack
- Next.js (App Router) + React + TypeScript estricto
- CSS nativo (global + CSS Modules), sin Tailwind
- Supabase: PostgreSQL, Auth, Storage, RLS, RPC
- Lógica de servidor: Server Actions y Route Handlers (instalación, login, reservas, email con nodemailer)
- Despliegue previsto: Vercel

## Estructura (implementado en FASE 0A)
- `supabase/migrations/`: SQL numerado (12 ficheros; la 010 **pendiente de aplicar**, el resto aplicadas en el proyecto Supabase)
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

**Migración 008 (FASE 4, aplicada):**
- Añade `site_settings.timezone` (`text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires'`, IANA; valor elegido por la usuaria)
- Corrige `get_available_slots`: la ventana devuelta dura la **sesión** (`session_duration`) y el avance entre huecos es **sesión + descanso**; los instantes se convierten con `AT TIME ZONE timezone`; guardas contra bucle infinito al envolver las 24:00 y contra paso 0
- Corrige `create_public_booking`: exige `ends_at - starts_at = duración de sesión` (no sesión+descanso), comprueba vacaciones en fecha local, y valida que el inicio encaja en un hueco de `availability_slots` (día local + múltiplo del paso)

**Migración 009 (fix post-FASE 4, aplicada):**
- Recrea `appointments_no_overlap` **sin** `modality WITH =`: dos citas activas no se solapan ni entre modalidades (online y presencial comparten agenda). Un inicio exactamente al terminar otra (o al acabar su descanso) se permite: la exclusión es estricta (`<` / `>`). Si ya existen solapes cruzados, la migración se detiene con un mensaje indicando cuántas citas resolver en el panel (todo se revierte en el SQL Editor)
- `get_available_slots`: un hueco figura como ocupado por cualquier cita activa, sea cual sea su modalidad
- `create_public_booking`: la revalidación de solape mira cualquier modalidad; el límite de 3 citas futuras por teléfono sigue contando **por modalidad**
- Sin cambios de permisos (`CREATE OR REPLACE` conserva los grants existentes)

**Migración 010 (FASE 8B, pendiente de aplicar):**
- Añade `clinical_records.appointment_id` (`uuid NULL REFERENCES appointments(id) ON DELETE SET NULL`): enlace opcional entre una nota de historia y su cita; la nota es propia (`session_date` propio) y sobrevive si la cita se borra (el FK vacía el enlace) o se cancela (el servicio de citas vacía el enlace en el servidor)
- Índices: `idx_clinical_records_appointment_id` (búsqueda) y `idx_clinical_records_appointment_unique` (parcial WHERE NOT NULL): una sola nota por cita
- Sin cambios de políticas RLS (`is_owner()` en `clinical_records` ya cubre la columna nueva); sin funciones RPC nuevas

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
- `POST /api/instalacion/verificar-conexion` — Valida `INSTALL_TOKEN` (recibido por FormData, con trim) y verifica conectividad con Supabase
- `POST /api/instalacion/subir-foto` — Sube foto de la psicóloga a Storage `public-images`
- `POST /api/instalacion/ejecutar` — Ejecuta instalación completa (Server Action)
- `GET /api/instalacion/verificar-instalacion` — Verifica si `setup_completed` es true

## Rutas API (implementadas en FASE 2)
- `POST /api/auth/recover` — Recuperación de contraseña (respuesta idéntica exista o no la cuenta)
- `POST /api/auth/logout` — Cierre de sesión
- `GET /api/auth/session` — Obtiene usuario actual para header del panel

## Server Actions de autenticación (FASE 2)
- `loginAction` — Login con email+password, verifica teléfono via RPC `verify_login_phone`, rate limiting por IP/email, cookies persistentes opcionales
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
- Colores de evento (hex fijos, pendientes de alinear con tokens cuando exista tema oscuro del panel): online `#2563eb`, presencial `#059669`, completada `#64748b`, cancelada/no presentó `#94a3b8` (además `locked: true` en finalizadas)
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
- `/panel-psicologa/historias/[id]` — línea de tiempo de sesiones (fecha dd/mm/aaaa, contenido HTML saneado con `dangerouslySetInnerHTML` + `sanitizarHtml`, archivos adjuntos con nombre/tamaño/tipo), botones Nueva sesión, Editar, Eliminar (ConfirmarModal), adjuntar archivos por sesión y abrirlos con URL firmada en pestaña nueva. `SesionModal.tsx` con fecha (input date), `EditorWysiwyg` (prop `placeholder` nueva) y selección de archivos con lista previa
- Enlace "Ver historia clínica" desde la ficha del paciente (`PacienteDetalle.tsx`)

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
- Migración **010** (pendiente de aplicar): `clinical_records.appointment_id` nullable con `ON DELETE SET NULL` + índice simple + índice único parcial (una sola nota por cita). RLS sin cambios (`is_owner()` ya cubre la tabla)

### Servicio (`src/services/historias.ts`)
- `crearSesionHistoria`/`editarSesionHistoria` aceptan `appointmentId` opcional; con `validarCitaParaNota` se comprueba en servidor que la cita existe, pertenece al mismo paciente y no tiene ya otra nota enlazada (devuelve mensaje genérico de error)
- `listarCitasParaNota(patientId, excluirRecordId?)`: citas pasadas del paciente con `clinical_records(id)` embebido; excluye las ya enlazadas a otra nota (salvo la propia al editar); límite 50
- `listarHistoriaPaciente` trae `appointment_id` y la cita embebida (`fechaIso`, `finIso`, `modality`) como `citaOrigen` en cada sesión; los embeds se normalizan con `Array.isArray` (PostgREST los devuelve como array)
- `session_date` sigue siendo propio de la nota: se prellena de la cita al elegirla en el modal, pero si luego se mueve o edita la cita, la fecha de la nota no cambia

### Citas (`src/services/citas.ts`)
- `SELECT_CITA` incluye `clinical_records(id)` → `notaId` en `CitaFila`; el listado y el calendario no muestran contenido clínico, solo el enlace a la nota
- Al editar una cita, si el estado final es `cancelled` y el anterior no lo era, se vacía `appointment_id` de la nota enlazada (la nota sobrevive con el enlace vacío)
- Borrar una cita vacía el enlace por el FK `ON DELETE SET NULL`

### Panel
- `CitaModal`: en citas editadas con estado Completada (o con nota ya enlazada), bloque de enlace "Ver nota en la historia" o "Escribir nota de sesión" (`?cita=<id>`)
- `CitasPanel`: en la columna de acciones, icono de enlace a la historia (ver nota si `notaId`, o escribir si completada sin nota)
- `SesionModal`: selector "Cita de origen (opcional)" con citas pasadas sin nota (excluye la propia al editar); al elegir cita se prellena la fecha
- `HistoriaPaciente`: badge de cita de origen (fecha, hora, modalidad) en cada sesión; acepta `?cita=` en la URL para abrir el modal de nueva sesión con la cita preseleccionada

### Reglas de seguridad aplicadas
- Toda acción pasa por Server Actions con `exigirSesion()`; RLS `is_owner()` sin cambios; validación de la cita en servidor (mismo paciente, sin nota previa); el contenido clínico no sale del panel (citas muestran solo enlace)

## Historial de cambios
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
