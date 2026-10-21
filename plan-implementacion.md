# Plan de implementación: PsicoCMS (Next.js + Supabase)

> Borrador listo para usar. Fuente de verdad funcional: AGENTS.md. Orden obligatorio. Después de cada fase: probar, corregir (fixes.md), commit en Git.
> Cada sub-tarea completada se marca [x]. Cada fase completada actualiza MAP.md.

## Optimizaciones propuestas (confirmar antes de empezar)
- Antes de construir interfaz, la FASE 0C limpia los recursos (tokens de color con significado, un solo h1, Font Awesome y fuentes ligeras, imágenes optimizadas) para que los 5 temas y el panel partan de una base ordenada.
- Ante conflicto entre `dashboard-design` y AGENTS.md, manda AGENTS.md (disponibilidad, teléfono visible, sin filtro de género ni ingresos, todo en español).
- Las reglas de la sección "Seguridad" de AGENTS.md se aplican en cada fase (permisos de funciones, `is_owner()`, límites, consentimiento). Las tareas de seguridad concretas aparecen en cada fase.
- Skills: el kit incluye 5 skills propias en `.agents/skills/` (seguridad, citas, fechas, temas y textos). Las skills de terceros recomendadas (ver `skills-recomendadas.md`) se instalan en el momento indicado, tras leer su `SKILL.md`.
- Los 5 temas visuales: en la FASE 1 se construye el sistema de temas con el tema base funcionando; los 4 restantes se crean en la FASE 12.
- Componentes de UI reutilizables (modal, toast, empty state, tabla paginada, formularios) y capa de servicios se crean en la FASE 3 y se reutilizan después.
- Componentes de servidor por defecto; `"use client"` solo en lo interactivo (calendario, editor, formularios con estado).
- Las páginas públicas se renderizan en servidor y se revalidan cuando cambia el contenido desde el panel.

---

## FASE 0A: Proyecto Next.js
- [x] Crear proyecto (App Router, TypeScript, ESLint, `src/`, alias `@/*`, sin Tailwind)
- [x] Instalar dependencias iniciales (supabase-js, @supabase/ssr, isomorphic-dompurify, server-only)
- [x] Comprobar que `.agents/skills/` está en la raíz y que la herramienta la detecta (pedirle que liste las skills disponibles)
- [x] Comprobar que `.opencode/commands/` está en la raíz y que los comandos aparecen al escribir `/` en OpenCode
- [x] Estructura de rutas y carpetas (public, instalacion, acceso-psicologa, panel-psicologa, lib, services, actions, themes, components/ui)
- [x] Clientes de Supabase (navegador, servidor, admin server-only)
- [x] Middleware (o proxy.ts) que protege `/panel-psicologa/*` — *con Next 16.4.1 el nombre oficial es `proxy.ts`: renombrar `middleware.ts` pendiente*
- [x] `.env.local` y `.env.example` (incluye `INSTALL_TOKEN`), `.gitignore` correcto
- [x] Páginas mínimas de prueba, `npm run build`, `git init` y primer commit
- [x] Actualizar MAP.md

## FASE 0B: Supabase y base de datos
- [x] Guía para crear el proyecto Supabase, desactivar registros públicos y obtener URL, anon key y service_role key
- [x] Migración 001: tablas
- [x] Migración 002: restricciones (teléfono solo dígitos y no único, número de ficha correlativo, no solapamiento de citas con btree_gist) — *el `appointment_id ON DELETE SET NULL` de las notas clínicas quedó en la migración 010, no en la 002*
- [x] Migración 003: función `is_owner()` y RLS con políticas (anon solo contenido público; authenticated solo con `is_owner()`)
- [x] Migración 004: funciones RPC (`get_available_slots`, `create_public_booking`, `is_setup_completed`, `verify_login_phone`)
- [x] Migración 004b: revocar `EXECUTE` a `PUBLIC` y `anon` en todas las funciones (solo `create_public_booking` y `check_rate_limit` para `service_role`)
- [x] Migración 004c: tabla `rate_limit_events` y función `check_rate_limit`
- [x] `email_settings` con la contraseña en Vault o cifrada y sin lectura desde el cliente
- [x] Campos de consentimiento (`consent_at`, `consent_version`) en pacientes
- [x] Migración 005: buckets de Storage con límites de tipo y tamaño y sus políticas
- [x] Seed inicial (categorías de blog, 5 temas, frases públicas por defecto)
- [x] Generar tipos TypeScript de la base de datos
- [x] Probar políticas como anon y como authenticated
- [x] Probar llamando directamente a cada función como anon: solo deben responder las públicas
- [x] Probar con un segundo usuario de prueba: no debe ver ni escribir nada (`is_owner()`)
- [x] Actualizar MAP.md con tablas, funciones y buckets

## FASE 0C: Recursos visuales
- [x] Consolidar las variables de color de `tema-visual-base` en variables con significado (apariencia idéntica) y documentar la equivalencia en MAP.md
- [x] Corregir textos con errores y dejar un único `h1` por página (sin duplicar cabecera de escritorio y móvil)
- [x] Quitar textos de relleno fijos con nombre propio (serán datos configurables)
- [x] Font Awesome: conservar solo `all.min.css` y `webfonts` (WOFF2); eliminar el resto
- [ ] Convertir fuentes propias a WOFF2, solo los pesos usados, con `next/font/local` — *siguen en TTF en `src/lib/fonts.ts`; también sobran pesos no usados en `public/fonts/`*
- [ ] Optimizar imágenes (por ejemplo `psicologa.png` a WebP) — *el listado de imágenes en MAP.md está hecho; falta la optimización (`psicologa.png` ~987 KB, ningún `.webp` en el proyecto)*
- [x] Colocar recursos limpios en `public/` y `src/themes/base/`
- [x] Extraer tokens del panel desde `dashboard-design` (colores, tipografía, radios, sombras, espaciados) a variables CSS y anotarlos en MAP.md
- [x] Verificar que el tema base se ve igual y que `npm run build` compila

## FASE 1: Asistente de instalación
- [x] Guard de `/instalacion` (solo si `setup_completed` es falso)
- [x] Server Action `instalar` (crea el usuario único con el cliente admin; se niega si ya existe y exige `INSTALL_TOKEN`)
- [x] Pasos del asistente: conexión, datos de acceso, información pública, foto (Storage), tema
- [x] Sistema de temas + tema base funcionando
- [x] Marcar `setup_completed` y redirigir al dashboard

## FASE 2: Login seguro
- [x] Página `/acceso-psicologa` (email + teléfono + contraseña, los 3 obligatorios)
- [x] Server Action de login + RPC `verify_login_phone` + mensaje de error genérico
- [x] "Mantener sesión iniciada" (cookie persistente vs de sesión)
- [x] Verificación con `getUser` en el servidor y cierre de sesión
- [x] Contraseña fuerte (mínimo 12 caracteres) en formulario y en Supabase Auth
- [x] Límite de intentos de login por IP y email, con mensaje genérico
- [x] Recuperación de contraseña con respuesta idéntica exista o no la cuenta
- [x] Cookies de sesión seguras y reautenticación para cambios sensibles

## FASE 3: Layout y menú del dashboard
- [x] Layout compartido de `/panel-psicologa` con menú lateral izquierdo y desplegables
- [x] Componentes reutilizables (modal, toast, empty state, tabla paginada, formularios)
- [x] Capa de servicios y patrón de Server Actions con comprobación de sesión
- [x] Diseño basado en `dashboard-design`, responsive

## FASE 4: Inicio, disponibilidad y citas
- [x] Página de inicio con resumen y estadísticas (datos de prueba)
- [x] Duración de sesión online/presencial y descanso entre sesiones
- [x] Selector de horas y semana de 7 días con huecos marcables; guardar
- [x] Modo vacaciones (interruptor) y periodos de vacaciones (añadir/borrar)
- [x] Aviso al cambiar duración o descanso (reconfigurar huecos)
- [x] CRUD de citas: listado paginado con filtros, añadir, editar, eliminar
- [x] Validación de solapamientos (frontend + base de datos; también entre modalidades: migración 009 + `hayConflicto`)
- [x] Estados de la cita (pendiente, realizada, cancelada, no asistió) con cambio desde el listado y el calendario; cancelada o no asistió libera el hueco

## FASE 5: Calendario de citas
- [x] Verificar compatibilidad de CalendarJS con React/Next (o proponer alternativa)
- [x] Ver, añadir, editar y mover citas desde el calendario

## FASE 6: Blog y editor wysiwyg
- [x] Integrar `jodit-react` (solo cliente) con su CSS
- [x] CRUD de artículos con imagen (Storage) y categoría
- [x] CRUD de categorías
- [x] Sanear con DOMPurify al mostrar contenido

## FASE 7: Pacientes
- [x] CRUD de pacientes con id interno (UUID) y número de ficha correlativo; el teléfono es un dato de contacto normalizado, no único
- [x] Aviso (sin bloquear) si se crea un paciente con un teléfono que ya existe, y marca/revisión de posibles duplicados
- [x] Urls del panel con el id interno, nunca con el teléfono
- [x] Exportar datos del paciente y eliminarlos/anonimizarlos con confirmación explícita
- [x] Buscador de pacientes (por nombre, teléfono o número de ficha) al crear una cita; crear paciente + cita a la vez si no existe

## FASE 8: Historias clínicas
- [x] Historia por paciente con notas de sesión (fecha propia, contenido, fechas de creación y edición)
- [x] Enlace opcional nota-cita: botón "Escribir nota de sesión" en citas realizadas y "Nueva nota" en la ficha del paciente (con opción de elegir una cita pasada sin nota)
- [x] Comprobar que cancelar o borrar una cita conserva sus notas y que las notas no aparecen en calendario, listados, emails ni búsqueda pública
- [x] Subida de fotos y PDFs al bucket privado con validación de tipo y tamaño en servidor, nombres UUID y vista con URLs firmadas de corta duración
- [x] Sanear con DOMPurify el contenido de las historias al mostrarlo
- Nota: la migración **010** (`clinical_records.appointment_id`) está **aplicada**. Decisión del usuario (2026-10-18): una cita puede tener **varias notas** → código ajustado (`validarCitaParaNota` sin rechazo de duplicados, `listarCitasParaNota` devuelve todas las citas pasadas, selector del modal ampliado); el índice único parcial de la 010 se elimina con la migración **011**, **aplicada** el 2026-10-19

## FASE 9: Protección de datos
- [x] Configuración de la plantilla con editor wysiwyg
- [x] PDF vacío descargable y PDF relleno desde la ficha del paciente (vista de impresión)

## FASE 10: Preguntas frecuentes
- [x] CRUD de FAQs con orden

## FASE 11: Información pública
- [x] Edición de todos los datos mostrados en la web (servicios, especialidades, planes, horarios, dirección, sobre mí)
- [x] Revalidar las páginas públicas al guardar
- Nota: los horarios ya se configuran en Disponibilidad (FASE 4); Información pública enlaza allí. La foto se gestiona desde Perfil privado (FASE 15). El "sobre mí" usa editor wysiwyg con DOMPurify. Sin migración nueva (RLS y tablas ya existían)

## FASE 12: Temas visuales
- [x] Crear los 4 temas restantes en `src/themes/` (basados en el tema base)
- [x] Selector de tema, modo landing o multipágina, previsualización en nueva pestaña
- [x] Botón "¿Quieres un diseño personalizado?"
- [x] Web pública aplica el tema activo (clase `.tema-<nombre>` + tokens por clase)
- [x] Migración 012: CHECK de `layout_mode` en site_settings (el `active_theme` queda sin CHECK para ser plug and play)

## FASE 13: Gestión de imágenes
- [x] Gestión de imágenes estáticas por hueco (`site_images` + Storage), con prioridad sobre las de stock
- [x] Configurar `next/image` con el dominio de Supabase Storage

## FASE 14: Tema del panel y secciones activables
- [x] Modal de tema claro/oscuro + 8 colores principales, persistente (DB + cookie)
- [x] Activar/desactivar secciones (blog, reservas, FAQ, etc.)

## FASE 15: Configuraciones y extras del panel
- [x] Frases públicas editables
- [x] Redes sociales
- [x] Email y notificaciones (formulario Gmail + mini tutorial) con nodemailer en Server Action
- [x] Perfil privado (datos, contraseña, email de acceso, avatar) con contraseña actual para cambios sensibles
- [x] Verificación en dos pasos (TOTP) activable desde el perfil (Supabase MFA TOTP confirmado disponible)
- [x] Política de privacidad editable y versionada (panel + página pública /politica-privacidad + enlace en el footer)
- [x] Buscador general en la cabecera (pacientes, citas, notas de sesión, blog, FAQs) con página de resultados agrupados
- [x] Sección de ayuda con tutorial completo del dashboard
- [x] Cabecera del panel: botón de usuario (avatar + nombre) con desplegable "Perfil privado" / "Cerrar sesión"
- [x] Migración 014: `phone_private` (+ `verify_login_phone` la prefiere) y grants por columnas de `email_settings`
- [x] Migración 015: tabla `privacy_policy` (single-row, versionada, RLS: anon lectura / dueña CRUD / service_role)
- [x] Botón "ver web pública" en la barra lateral
- Nota: el enlace a la política de privacidad desde el **formulario de reserva** queda para la FASE 17 (el formulario aún no existe); ya está el enlace en el footer público.
- Nota: `professional_profile` no gana `email_private`: el email de acceso es el email de Supabase Auth (fuente única de verdad).
- Nota: recuperación del TOTP si se pierde la app: script en servidor con `admin.auth.admin.unenroll()` (documentado en MAP.md), pendiente de ejecutar cuando haga falta.

## FASE 16: Parte pública
- [x] Páginas: inicio, sobre mí, servicios, blog, FAQ, pide cita (+ dónde estamos con mapa)
- [x] Botones de cita, llamada, WhatsApp y email
- [x] Modo landing (una página con scroll suavizado) o multipágina según el tema
- [x] SEO: `generateMetadata`, `sitemap.ts`, `robots.ts`, JSON-LD, revalidación
- Nota: el blog público se crea aquí en versión básica (listado + artículo); paginación y filtro por categorías quedan para la FASE 18. El formulario de reserva en `/pide-cita` llega en la FASE 17 (hasta entonces, empty state con contacto directo).
- Nota: `NEXT_PUBLIC_URL` añadida a `.env.example` (SEO: canonical, sitemap, Open Graph). Añadirla en `.env.local` y en el hosting con el dominio real.

## FASE 17: Reservas públicas
- [x] Selector online/presencial y calendario con la disponibilidad real (`get_available_slots`)
- [x] Formulario (nombre, teléfono solo números, motivo) y Server Action que llama a `create_public_booking` (solo `service_role`)
- [x] Casilla obligatoria de política de privacidad y guardado del consentimiento
- [x] Honeypot o captcha, límite de intentos por IP y teléfono, máximo de citas futuras activas por teléfono
- [x] Validación en servidor (longitudes, fechas pasadas, disponibilidad) y respuesta pública genérica
- [x] Modal de confirmación + enlace a Google Calendar (sin APIs)
- [x] Email a la psicóloga si está configurado (sin romper la reserva si falla) y sin el motivo de la consulta

## FASE 18: Blog público
- [x] Listado paginado, filtro por categorías, artículo individual
- [x] Redes sociales en el footer

## FASE 19: Seguridad y despliegue
- [x] Cabeceras de seguridad en Next (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy) y HSTS
- [x] `npm audit` sin vulnerabilidades graves *(5 high solo en eslint-config-next, dependencias de desarrollo; no afectan al runtime — anotado en MAP.md)*
- [x] Auditoría de RLS, storage, RPC, Server Actions y claves (código); hallazgos en MAP.md
- [ ] Prueba de abuso: llamar directamente a la reserva en Supabase y enviar muchas reservas seguidas *(usuario, con el sitio desplegado)*
- [x] Elegir y documentar la región de Supabase y la política de conservación de datos *(eu-west-1 anotado; política en MAP.md, revisar con asesor legal)*
- [ ] Comprobar copias de seguridad del plan de Supabase *(usuario, dashboard Supabase)*
- [ ] Desplegar en Vercel y configurar variables de entorno *(usuario; pasos en MAP.md)*
- [ ] Configurar dominio y URLs permitidas en Supabase Auth *(usuario; pasos en MAP.md)*
- [ ] Revisar copias de seguridad del proyecto Supabase *(usuario)*
- [ ] Prueba final completa del flujo: instalación -> login -> reserva -> email -> historia *(usuario)*
- Nota: `middleware.ts` renombrado a `proxy.ts` (Next 16); rate limit de login con IP real; URL del sitio unificada en `NEXT_PUBLIC_URL`
