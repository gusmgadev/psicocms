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
- [x] Middleware (o proxy.ts) que protege `/panel-psicologa/*`
- [x] `.env.local` y `.env.example` (incluye `INSTALL_TOKEN`), `.gitignore` correcto
- [x] Páginas mínimas de prueba, `npm run build`, `git init` y primer commit
- [x] Actualizar MAP.md

## FASE 0B: Supabase y base de datos
- [x] Guía para crear el proyecto Supabase, desactivar registros públicos y obtener URL, anon key y service_role key
- [x] Migración 001: tablas
- [x] Migración 002: restricciones (teléfono solo dígitos y no único, número de ficha correlativo, no solapamiento de citas con btree_gist)
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
- [x] Convertir fuentes propias a WOFF2, solo los pesos usados, con `next/font/local` (TTF copiados, pendiente conversión WOFF2 para producción)
- [x] Optimizar imágenes (por ejemplo `psicologa.png` a WebP) y listar las imágenes de stock en MAP.md para verificar licencias
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
- [ ] Página `/acceso-psicologa` (email + teléfono + contraseña, los 3 obligatorios)
- [ ] Server Action de login + RPC `verify_login_phone` + mensaje de error genérico
- [ ] "Mantener sesión iniciada" (cookie persistente vs de sesión)
- [ ] Verificación con `getUser` en el servidor y cierre de sesión
- [ ] Contraseña fuerte (mínimo 12 caracteres) en formulario y en Supabase Auth
- [ ] Límite de intentos de login por IP y email, con mensaje genérico
- [ ] Recuperación de contraseña con respuesta idéntica exista o no la cuenta
- [ ] Cookies de sesión seguras y reautenticación para cambios sensibles

## FASE 3: Layout y menú del dashboard
- [ ] Layout compartido de `/panel-psicologa` con menú lateral izquierdo y desplegables
- [ ] Componentes reutilizables (modal, toast, empty state, tabla paginada, formularios)
- [ ] Capa de servicios y patrón de Server Actions con comprobación de sesión
- [ ] Diseño basado en `dashboard-design`, responsive

## FASE 4: Inicio, disponibilidad y citas
- [ ] Página de inicio con resumen y estadísticas (datos de prueba)
- [ ] Duración de sesión online/presencial y descanso entre sesiones
- [ ] Selector de horas y semana de 7 días con huecos marcables; guardar
- [ ] Modo vacaciones (interruptor) y periodos de vacaciones (añadir/borrar)
- [ ] Aviso al cambiar duración o descanso (reconfigurar huecos)
- [ ] CRUD de citas: listado paginado con filtros, añadir, editar, eliminar
- [ ] Validación de solapamientos (frontend + base de datos)

## FASE 5: Calendario de citas
- [ ] Verificar compatibilidad de CalendarJS con React/Next (o proponer alternativa)
- [ ] Ver, añadir, editar y mover citas desde el calendario

## FASE 6: Blog y editor wysiwyg
- [ ] Integrar `jodit-react` (solo cliente) con su CSS
- [ ] CRUD de artículos con imagen (Storage) y categoría
- [ ] CRUD de categorías
- [ ] Sanear con DOMPurify al mostrar contenido

## FASE 7: Pacientes
- [ ] CRUD de pacientes con id interno (UUID) y número de ficha correlativo; el teléfono es un dato de contacto normalizado, no único
- [ ] Aviso (sin bloquear) si se crea un paciente con un teléfono que ya existe, y marca/revisión de posibles duplicados
- [ ] Urls del panel con el id interno, nunca con el teléfono
- [ ] Exportar datos del paciente y eliminarlos/anonimizarlos con confirmación explícita
- [ ] Buscador de pacientes (por nombre, teléfono o número de ficha) al crear una cita; crear paciente + cita a la vez si no existe

## FASE 8: Historias clínicas
- [ ] Historia por paciente (notas por sesión)
- [ ] Subida de fotos y PDFs al bucket privado con validación de tipo y tamaño en servidor, nombres UUID y vista con URLs firmadas de corta duración
- [ ] Sanear con DOMPurify el contenido de las historias al mostrarlo

## FASE 9: Protección de datos
- [ ] Configuración de la plantilla con editor wysiwyg
- [ ] PDF vacío descargable y PDF relleno desde la ficha del paciente (vista de impresión)

## FASE 10: Preguntas frecuentes
- [ ] CRUD de FAQs con orden

## FASE 11: Información pública
- [ ] Edición de todos los datos mostrados en la web (servicios, especialidades, planes, horarios, dirección, sobre mí)
- [ ] Revalidar las páginas públicas al guardar

## FASE 12: Temas visuales
- [ ] Crear los 4 temas restantes en `src/themes/` (basados en el tema base)
- [ ] Selector de tema, modo landing o multipágina, previsualización en nueva pestaña
- [ ] Botón "¿Quieres un diseño personalizado?"

## FASE 13: Gestión de imágenes
- [ ] Gestión de imágenes estáticas por hueco (`site_images` + Storage), con prioridad sobre las de stock
- [ ] Configurar `next/image` con el dominio de Supabase Storage

## FASE 14: Tema del panel y secciones activables
- [ ] Modal de tema claro/oscuro + 8 colores principales, persistente (DB + cookie)
- [ ] Activar/desactivar secciones (blog, reservas, FAQ, etc.)

## FASE 15: Configuraciones y extras del panel
- [ ] Frases públicas editables
- [ ] Redes sociales
- [ ] Email y notificaciones (formulario Gmail + mini tutorial) con nodemailer en Server Action
- [ ] Perfil privado (datos, contraseña, avatar) con contraseña actual para cambios sensibles
- [ ] Verificación en dos pasos (TOTP) activable desde el perfil, si Supabase lo permite
- [ ] Política de privacidad editable y versionada, enlazada desde el formulario de reserva
- [ ] Buscador global (citas, pacientes, historias, blog...)
- [ ] Sección de ayuda con tutorial
- [ ] Botón "ver web pública" en la barra lateral

## FASE 16: Parte pública
- [ ] Páginas: inicio, sobre mí, servicios, blog, FAQ, pide cita (+ dónde estamos con mapa)
- [ ] Botones de cita, llamada, WhatsApp y email
- [ ] Modo landing (una página con scroll suave) o multipágina según el tema
- [ ] SEO: `generateMetadata`, `sitemap.ts`, `robots.ts`, JSON-LD, revalidación

## FASE 17: Reservas públicas
- [ ] Selector online/presencial y calendario con la disponibilidad real (`get_available_slots`)
- [ ] Formulario (nombre, teléfono solo números, motivo) y Server Action que llama a `create_public_booking` (solo `service_role`)
- [ ] Casilla obligatoria de política de privacidad y guardado del consentimiento
- [ ] Honeypot o captcha, límite de intentos por IP y teléfono, máximo de citas futuras activas por teléfono
- [ ] Validación en servidor (longitudes, fechas pasadas, disponibilidad) y respuesta pública genérica
- [ ] Modal de confirmación + enlace a Google Calendar (sin APIs)
- [ ] Email a la psicóloga si está configurado (sin romper la reserva si falla) y sin el motivo de la consulta

## FASE 18: Blog público
- [ ] Listado paginado, filtro por categorías, artículo individual
- [ ] Redes sociales en el footer

## FASE 19: Seguridad y despliegue
- [ ] Cabeceras de seguridad en Next (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy) y HSTS
- [ ] `npm audit` sin vulnerabilidades graves
- [ ] Auditoría de RLS, storage, RPC, Server Actions y claves (prompt 07)
- [ ] Prueba de abuso: llamar directamente a la reserva en Supabase y enviar muchas reservas seguidas
- [ ] Elegir y documentar la región de Supabase y la política de conservación de datos
- [ ] Comprobar copias de seguridad del plan de Supabase
- [ ] Desplegar en Vercel y configurar variables de entorno
- [ ] Configurar dominio y URLs permitidas en Supabase Auth
- [ ] Revisar copias de seguridad del proyecto Supabase
- [ ] Prueba final completa del flujo: instalación -> login -> reserva -> email -> historia