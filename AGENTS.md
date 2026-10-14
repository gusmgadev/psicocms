# Proyecto: PsicoCMS

## Rol del agente:
Desarrollador web con 12 años de experiencia.

---

## Objetivo general:

Crear una aplicación web (CMS) para psicologas, donde puedan:

- Tener una web administrable.
- Elegir entre varios temas visuales.
- Tener blog.
- Gestionar reservas de citas.
- Tener un panel de administración.
- Gestionar pacientes.
- Gestionar historias clinicas.
- Gestionar disponibilidad y calendario.
- Administrar toda la información publica de la web.

El objetivo es cubrir el flujo de trabajo completo de una psicologa independiente.

Todo se podrá administrar desde un panel privado.

---

## Consideraciones generales:

Estas reglas aplican SIEMPRE a todas las fases y funcionalidades:

- Protección de rutas.
- Validación de solapamientos.
- Priorizar secillez, que todo sea intuitivo y facil de entender.
- Priozar buenas practicas y seguridad.
- Mostrar mensajes de confirmación.
- Si no existen datos en una seccion, mostrar un "empty state" agradable.
- Usar Font Awesome (tenemos la fuente en concreto para usar en la carpeta "tema-visual-base/assets/fonts") 
- Todas las acciones del dashboard requieren autenticación.
- Todas las urls del panel deben comenzar por: /panel-psicologa
- Todas las funcionalidades deben ser totalmente funcionales.
- No romper funcionalidades anteriores.
- Mantener la consistencia visual en todo el dashboard.
- Mantener coherencia responsive.
- Priorizar UX.
- Priorizar reutilizacion de componentes.
- Row Level Security (RLS) activado en TODAS las tablas. Las tablas privadas (pacientes, citas, historias, configuración sensible) nunca son accesibles para el rol anónimo.
- La `service_role` key solo existe en el servidor (variable de entorno SIN prefijo `NEXT_PUBLIC_` y módulo con `import 'server-only'`). Nunca en componentes de cliente ni en el repositorio. En el navegador solo se usa la `anon` key (pública).
- Toda Server Action y Route Handler del panel verifica la sesión en el servidor (`getUser`) antes de actuar. No confiar nunca solo en el middleware ni en el frontend.
- Toda validación importante se hace también en la base de datos (constraints, checks, funciones RPC), no solo en el frontend.
- Los datos sensibles (historias clínicas) solo son accesibles con sesión iniciada; los archivos se sirven con URLs firmadas.
- Las reglas de la sección "Seguridad" (más abajo) son obligatorias en todas las fases.
- Las skills (las del proyecto en `.agents/skills/` y las de terceros que instale) son guías de apoyo: ante cualquier conflicto manda este documento. No instales librerías ni cambies el stack porque una skill lo sugiera (por ejemplo Tailwind, shadcn o Edge Functions). Usa las skills del proyecto que apliquen a cada tarea y dime cuáles usaste.

---

## Arquitectura general:

### Parte publica:

La parte pública incluirá:

- Homepage
- Sobre mí
- Servicios
- Especialidades
- Blog
- Preguntas frecuentes
- Sistema de reserva de citas
- Contacto

### Dashboard privado:

El dashboard permitirá:

- Gestionar citas.
- Gestionar pacientes.
- Gestionar historias.
- Gestionar blog.
- Gestionar preguntas frecuentes.
- Gestionar servicios.
- Gestionar especialidades.
- Gestionar temas visuales.
- Gestionar imagenes.
- Gestionar configuraciones de la web.
- Gestionar disponibilidad.
- Gestionar frases publicas.
- Gestionar notificaciones por email.
- Gestionar redes sociales.
- Gestionar el perfil privado.


---

## Seguridad:
Estas reglas son obligatorias en todas las fases y se comprueban en la auditoría final. Ante cualquier duda de seguridad, pregúntame antes de implementar.

### Acceso y base de datos
- Crear la función `is_owner()` (`SECURITY DEFINER`, `search_path` fijado): devuelve verdadero solo si `auth.uid()` es el usuario de la psicologa registrado en `professional_profile`. Todas las políticas del rol `authenticated` usan `is_owner()`, no solo "estar autenticado". Así, aunque por error se activara el registro de usuarios, un usuario nuevo no vería nada.
- En Postgres las funciones son ejecutables por `PUBLIC` por defecto. Toda función RPC debe revocar `EXECUTE` a `PUBLIC` y a `anon`, y concederlo solo a quien corresponda (`service_role`, `authenticated` o `anon`). Documentar en `MAP.md` quién puede ejecutar cada función.
- `create_public_booking` solo la ejecuta `service_role`: la reserva pública pasa únicamente por la Server Action, nunca por una llamada directa del navegador a Supabase. `get_available_slots` y `is_setup_completed` pueden ser públicas y no devuelven datos personales. `verify_login_phone` solo la ejecuta `authenticated` con `is_owner()`.
- `email_settings`: la contraseña de aplicación de Gmail se guarda en Supabase Vault o cifrada. Ninguna política permite leer ese dato desde el cliente (ni siquiera a `authenticated`): solo se escribe desde una Server Action y solo la lee el servidor (`service_role`). La interfaz muestra "contraseña guardada" sin el valor.
- Los límites de intentos se guardan en una tabla `rate_limit_events` con una función `check_rate_limit` ejecutable solo por `service_role` (en un entorno serverless no sirve guardarlos en memoria).

### Autenticación
- Contraseña fuerte: mínimo 12 caracteres, validada en el formulario y configurada en Supabase Auth (longitud mínima; activar la protección contra contraseñas filtradas si el plan lo permite).
- El teléfono NO es un segundo factor real (es público en la web). La protección real es: contraseña fuerte + verificación en dos pasos (TOTP), recomendada y activable desde el perfil privado (FASE 15). Comprobar en la documentación actual de Supabase que está disponible.
- Límite de intentos de login por IP y por email en la Server Action, además de los límites propios de Supabase Auth. Mensajes de error genéricos.
- Recuperación de cuenta: flujo "olvidé mi contraseña" con el email de Supabase Auth, con la misma respuesta exista o no la cuenta. Definir cómo se recupera el acceso si se pierde el segundo factor y anotarlo en `MAP.md`.
- Cookies de sesión `httpOnly`, `secure` y `sameSite` (comprobar que `@supabase/ssr` lo cumple). El cierre de sesión invalida la sesión.
- Cambiar la contraseña o el email exige introducir la contraseña actual.

### Instalación
- `/instalacion` exige un código secreto de instalación (`INSTALL_TOKEN`, variable de entorno solo de servidor, de al menos 32 caracteres, nunca versionada) además de comprobar que `setup_completed` es falso. Sin el código correcto no se crea nada. Una vez instalado, la ruta redirige o devuelve 404.
- Alternativa: hacer la instalación en local antes de publicar el sitio.

### Reservas públicas y abuso
- La Server Action de reserva aplica: campo trampa (honeypot) o captcha (si se añade uno, pedirme autorización), límite de intentos por IP y por teléfono, máximo de citas futuras activas por teléfono, validación de todos los datos en servidor con límites de longitud (nombre, motivo), rechazo de fechas pasadas o fuera de disponibilidad, y revalidación dentro de `create_public_booking`.
- La respuesta pública es genérica: no devuelve datos del paciente ni indica si el teléfono ya existía.
- El email de aviso a la psicologa NO incluye el motivo de la consulta ni datos de salud: solo nombre, fecha, hora y modalidad. El detalle se consulta en el panel.
- El formulario incluye una casilla obligatoria de aceptación de la política de privacidad (con enlace) y se guarda la fecha y la versión del consentimiento (`consent_at`, `consent_version`).

### Archivos y contenido
- Buckets con límites configurados en el propio bucket y validados en servidor (tipo real y tamaño) antes de subir: `public-images` solo jpg, png y webp, sin SVG, máximo 5 MB; `clinical-files` solo imágenes y PDF, máximo 15 MB; `avatars` solo imágenes, máximo 2 MB. Los nombres de archivo los genera el sistema (UUID), nunca se usa el nombre original.
- Los archivos clínicos van bajo una ruta con el id del paciente y se sirven con URLs firmadas de muy corta duración (por ejemplo 60 segundos).
- El HTML de cualquier editor wysiwyg (blog, plantilla de protección de datos, historias clínicas) se sanea con DOMPurify siempre que se muestra.

### Aplicación
- Cabeceras de seguridad en Next: Content-Security-Policy (adaptada a Supabase, al mapa incrustado y a las fuentes), `frame-ancestors`/`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`, y HTTPS forzado (HSTS) en producción.
- Los errores no muestran detalles internos ni datos de pacientes. Los logs del servidor no contienen datos personales ni de salud. No se usan analíticas ni scripts de terceros sin consentimiento.
- Ejecutar `npm audit` antes de desplegar. No añadir librerías sin autorización.
- Nunca usar datos reales de pacientes en desarrollo ni en pruebas.

### Protección de datos y derechos
- Cada ficha de paciente permite exportar sus datos y eliminarlos o anonimizarlos (con confirmación explícita). Debe existir una política de conservación de datos documentada.
- Los textos legales (política de privacidad, consentimientos) los revisa la psicologa o un profesional del derecho: el sistema solo los muestra y gestiona, no sustituye el asesoramiento legal.
- Elegir la región del proyecto de Supabase conforme a la normativa aplicable y anotarla en `MAP.md`.
- Revisar las copias de seguridad que ofrece el plan de Supabase; si no bastan para datos clínicos, documentar un proceso de copia periódica.

---

## Funcionalidades de la aplicación:

### FASE 0A: Creación e inicialización del proyecto Next.js
- Crear el proyecto con `create-next-app` (última versión estable) con App Router, TypeScript, ESLint, carpeta `src/` y alias `@/*`. Sin Tailwind: CSS nativo + CSS Modules, font-size base de 10px y medidas en rem. Usar los flags necesarios para que el comando no sea interactivo.
- Si la carpeta ya contiene archivos (AGENTS.md, MAP.md, etc.), crearlo en una carpeta temporal y mover el contenido a la raíz sin sobrescribir mis archivos.
- Dependencias iniciales (solo estas, nada más sin mi autorización): `@supabase/supabase-js`, `@supabase/ssr`, `isomorphic-dompurify`, `server-only`.
- Estructura: rutas `(public)`, `/instalacion`, `/acceso-psicologa` y `/panel-psicologa`, cada una con su layout; `src/lib/supabase/` (cliente de navegador, de servidor y admin con `server-only`); `src/services/`; `src/actions/` (Server Actions); `src/themes/`; `src/components/ui/`. (Las fuentes, iconos e imágenes de "tema-visual-base" se incorporan en la FASE 0C, después de limpiarlos.)
- Middleware que protege `/panel-psicologa/*`: sin sesión redirige a `/acceso-psicologa`. (En versiones recientes de Next se llama `proxy.ts`: usar el nombre que corresponda a la versión instalada, comprobando la documentación oficial.)
- Crear `.env.local` y `.env.example` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` e `INSTALL_TOKEN` (sin valores reales) y comprobar que `.gitignore` excluye `.env*.local`.
- `git init` y primer commit si no existe repositorio.
- Verificación: cada ruta principal muestra una página mínima con su título, `npm run build` compila y el middleware redirige correctamente.
- Al terminar: actualizar `MAP.md`.

### FASE 0B: Preparación de Supabase y base de datos
- Crear el esquema completo como migraciones SQL versionadas en `supabase/migrations/` (una por tema, numeradas). Nunca editar una migración ya aplicada: cada cambio nuevo es una migración nueva.
- Guiarme paso a paso (en español, sin asumir que sé Supabase) para: crear el proyecto, desactivar el registro público de usuarios (Authentication > Providers/Settings), obtener la URL, la `anon` key y la `service_role` key (esta última solo para `.env.local`, nunca con prefijo `NEXT_PUBLIC_`), y ejecutar las migraciones (SQL Editor o Supabase CLI).
- Tablas principales (nombres en inglés, snake_case, `uuid` como clave primaria salvo indicación):
    - `professional_profile` (datos públicos y privados de la psicóloga, duración de sesión online y presencial, descanso entre sesiones y si está activo)
    - `site_settings` (una sola fila: tema activo, modo landing/multipágina, secciones activadas, modo vacaciones, `setup_completed`)
    - `services`, `specialties`, `plans` (planes y precios online/presencial)
    - `availability_slots` (modalidad, día de la semana, hora de inicio) y `vacation_periods`
    - `patients` (incluye `consent_at` y `consent_version`; `id` uuid como clave primaria; `patient_number` correlativo legible y único, ej. P-0042; `phone` obligatorio, solo dígitos y sin espacios, NO único; `possible_duplicate` para marcar fichas a revisar)
    - `appointments` (paciente, modalidad, inicio, fin, estado, motivo, origen: web o manual)
    - `clinical_records` y `clinical_files` (historias y sus archivos)
    - `data_protection_template`
    - `blog_categories`, `blog_posts`, `faqs`
    - `public_phrases` (clave/valor), `social_links`, `site_images` (hueco -> imagen)
    - `email_settings` (configuración de notificaciones; la contraseña de Gmail nunca es legible desde el cliente)
    - `rate_limit_events` (control de intentos para login y reservas)
    - `dashboard_preferences` (tema claro/oscuro y color primario)
- Restricciones en base de datos:
    - `patients.phone` con CHECK de solo dígitos (no único) e índice para buscar rápido. `patients.patient_number` se genera automáticamente y es único. El teléfono nunca es clave primaria ni se usa en las urls.
    - En `appointments`, restricción de exclusión (extensión `btree_gist`) para que dos citas activas no se solapen en el tiempo.
- RLS y políticas:
    - RLS activado en todas las tablas.
    - Rol `anon`: solo lectura del contenido público (servicios, especialidades, planes, FAQs, artículos publicados, categorías, frases públicas, redes sociales, imágenes, datos públicos de la web).
    - Rol `authenticated`, solo cuando `is_owner()` es verdadero (la psicóloga): lectura y escritura completa, excepto el valor secreto de `email_settings`, que nunca se lee desde el cliente.
    - Todas las políticas del rol `authenticated` usan `is_owner()` (ver sección Seguridad).
    - `anon` nunca lee `patients`, `appointments`, `clinical_*`, `email_settings` ni datos privados del perfil.
- Funciones RPC (`SECURITY DEFINER`, con `search_path` fijado):
    - `is_owner()`: comprueba que el usuario autenticado es la psicóloga (ver sección Seguridad).
    - `check_rate_limit(...)`: control de intentos (solo `service_role`).
    - `get_available_slots(modality, date_from, date_to)`: devuelve huecos libres sin exponer datos de pacientes (aplica descansos, vacaciones y modo vacaciones).
    - `create_public_booking(...)`: valida todo en servidor, normaliza el teléfono, reutiliza la ficha del paciente si coinciden teléfono y nombre (sin distinguir mayúsculas ni acentos) o crea una ficha nueva marcada como posible duplicado si el teléfono existe con otro nombre, y crea la cita. Solo la ejecuta `service_role`.
    - `is_setup_completed()`: dice si la instalación ya se hizo (accesible para `anon`).
    - `verify_login_phone(phone)`: comprueba que el teléfono coincide con el de la psicóloga (solo `authenticated`).
- Storage: buckets `public-images` (lectura pública, escritura solo autenticada), `clinical-files` (privado) y `avatars`, con sus políticas y con límites de tipo y tamaño de archivo (ver sección Seguridad).
- Datos iniciales (seed): categorías de blog por defecto, registro de los 5 temas, frases públicas por defecto.
- Revocar `EXECUTE` a `PUBLIC` y `anon` en todas las funciones salvo las que deban ser públicas (ver sección Seguridad).
- Al terminar: documentar tablas, funciones, quién puede ejecutar cada una, y buckets en `MAP.md`.

### FASE 0C: Preparación de los recursos visuales
- Objetivo: dejar los recursos de las carpetas "tema-visual-base" y "dashboard-design" listos y ligeros antes de construir encima. No se cambia la apariencia visual.
- `tema-visual-base` (web pública):
    - Sustituir las más de 30 variables de color con nombres genéricos (`--color-gray7`, `--color-orange4`...) por variables con significado (por ejemplo `--color-primario`, `--color-primario-oscuro`, `--color-fondo`, `--color-fondo-alt`, `--color-texto`, `--color-texto-suave`, `--color-borde`), de forma que cada tema nuevo solo redefina ese conjunto reducido. La apariencia del tema base debe quedar idéntica. Documentar en `MAP.md` la equivalencia entre variables antiguas y nuevas.
    - Corregir textos con errores (por ejemplo "Piscologia y asesoriamiento" aparece 3 veces) y dejar un único `h1` por página: la cabecera de escritorio y la móvil no deben duplicarlo y el resto de títulos pasan a `h2`/`h3` o `p` según corresponda. Mantener el HTML semántico.
    - Los textos de relleno con nombre propio (Maria Garcia, etc.) no se dejan fijos en el código: serán datos configurables.
- Font Awesome: conservar solo el CSS (`all.min.css`) y la carpeta `webfonts` en WOFF2. Eliminar svgs, js, less, scss, sprites y metadatos.
- Fuentes propias (Castoro, Lexend, Montserrat): convertir a WOFF2, conservar solo los pesos y estilos que realmente se usan y cargarlas con `next/font/local`.
- Imágenes: optimizar el peso (por ejemplo `psicologa.png`, de aproximadamente 1 MB, a WebP) sin perder calidad visual. Generar en `MAP.md` un listado de todas las imágenes de stock para que yo verifique que tengo derecho a redistribuirlas con el CMS.
- Colocar los recursos ya limpios en su sitio final: fuentes, iconos e imágenes en `public/` y el CSS del tema base en `src/themes/base/`.
- `dashboard-design`: son imágenes de referencia, no se modifican ni se copian a `public/`. Analizarlas y extraer a variables CSS del panel los colores, la tipografía, los radios, las sombras y los espaciados, anotando los tokens resultantes en `MAP.md`. Aplicar las reglas de la sección "Reglas sobre los recursos de diseño del panel".
- Verificar visualmente que el tema base sigue viéndose igual y que `npm run build` compila.
- Al terminar: actualizar `MAP.md` y avisarme para validar.

### FASE 1:
- Asistente de instalación en la url `/instalacion` (solo accesible mientras `setup_completed` sea falso; después redirige al login). Se rellenan en un inicio los datos más importantes de la psicologa:
    - Comprobación de la conexión con Supabase (las claves están en `.env.local`; si faltan o fallan, mostrar un mensaje claro con la guía para configurarlas). Ya no se crea la base de datos desde el asistente: eso se hizo en la FASE 0B.
    - Nombre y apellidos del / la psicologa.
    - Email, numero de telefono y contraseña (para hacer el login con esos 3 datos, unico y privado para la psicologa, no habrá multiples usuarios, ni registro, más allá de la instalación inicial). El usuario se crea en Supabase Auth mediante la Server Action `instalar`, que usa el cliente admin (`service_role`, solo en servidor) y se niega a funcionar si ya existe un usuario o la instalación está completada, y exige el código secreto `INSTALL_TOKEN` (ver sección Seguridad). (Si el agente considera que es demasiado para el alcance, alternativa: crear el usuario a mano en Authentication > Users y que el asistente solo guarde el resto. Elegir la más simple y dejarla anotada en `MAP.md`.)
    - Rellenar la información básica de la psicologa, para la web (nombre y apellidos, frase gancho o eslogan, numero de colegiado, numero de telefono para citas, email para citas, servicios principales, sobre mi, tipos de especialidades que sabe o hace, planes y precios (online y presencial), horarios y disponibilidad, direccion y lugar de consulta)
    - Subir foto de la psicologa, preferiblemente sin fondo (indicarlo). Se guarda en Supabase Storage (`public-images`).
    - Todo estos datos luego serán modificables y ampliables en el dashboard.
    - Seleccion de tema o plantilla visual (habrá 5 para elegir, basate en el que ya tenemos en la carpeta "tema-visual-base", ese será practicamente identico, pero basate en el para crear más).
    - Cuando el asistente termine, se marca `setup_completed` y llegaremos al dashboard de administración.

### FASE 2:
- Panel de aministración privado:
    - Login seguro, con Email, numero de telefono y contraseña.

    - Será obligatorio introducir los 3 datos y debe existir la opción de persistir el login ("mantener sesión iniciada").

    - Autenticación con Supabase Auth (email + contraseña; el cifrado lo gestiona Supabase) mediante una Server Action de login con `@supabase/ssr` (sesión en cookies). El teléfono actúa como tercer dato: tras validar email y contraseña se llama a la RPC `verify_login_phone`; si no coincide se cierra la sesión y se muestra un mensaje genérico (sin indicar qué dato falló). Seguridad en capas: middleware + verificación con `getUser` en el servidor + políticas RLS en la base de datos.

    - Persistencia: con "mantener sesión" las cookies de sesión llevan una caducidad larga (`maxAge`); sin marcarla, son cookies de sesión que desaparecen al cerrar el navegador.

    - Seguridad del login (ver sección Seguridad): contraseña fuerte, límite de intentos, recuperación de contraseña, verificación en dos pasos recomendada y contraseña actual para cambios sensibles. El teléfono es un dato adicional, no un segundo factor real.

    - Login de la psicologa en la url: /acceso-psicologa



### FASE 3:

- Dashboard en la url: /panel-psicologa (todas las urls de dentro del dashboard irán a partir de esta y todas requieren autenticación de la psicologa, al igual que cualquier acción que hagamos en el backend relacionado con el panel de administración)

- Layout estructura y menú del dashboard.
    - Se implementa con el layout compartido de `/panel-psicologa` (App Router), componentes de servidor por defecto y `"use client"` solo en las partes interactivas.

- El dashboard debe quedar muy simple, y debe tener un menú lateral izquierdo donde se agrupen las cosas de la gestion de la web publica y las configuraciones para no tener mucho lio. Ciertos elementos del menú serán desplegables (igual que en wordpress para agrupar cosas que tienen sentido que estén agrupadas) y las opciones más importantes para la gestíon de la psicologa deben tener su elemento del menú para un acceso mas rápido.



# FASE 4:
- Dentro del panel se podrá:
    - Pagina de inicio con un resumen de todo y estadisticas básicas (inicialmente con datos de prueba, cuando se completen el resto de fases ya aparecerán datos reales).


    - Configuración de disponibilidad de la profesional (online y presencial):
        - Debemos tener un campo de duracion de las sesiones (en minutos) (un campo para la duracion de la sesiones tanto online como presenciona, uno para cada una)
    
        Teniendo eso en cuenta:
            - Debemos tener un selector de hora de entrada y hora de salida (maxima)
            - Debemos tener una semana de 7 dias con la posibidad de marcar la disponibilidad de horas marcandolas dando click.
            - Y un boton de guardar, para dejar asignada la disponibilidad que luego se usará en la parte publica para que los pacientes puedan reservar cita.
            - En esta sección tambien habrá una palomita o un checkbox deslizante para marcar el "modo vaciones" y asi poder parar el sistema de citas.

        - Funcionalidad descanso entre sesiones tanto presencial como online y que ese tiempo se tenga en cuenta para los huecos de disponibilidad. 

            El descanso entre sesiones debe ser configurable en el dashboard y se puede configurar, activar y desactivar en la sección de disponibilidad del dashboard.
            Cuando hay tiempo de descanso entre sesiones configurado y activado, ese tiempo se "suma" al tiempo disponible de cada uno de los "huecos" disponibles que hay para reservar por parte de los pacientes (y se debe tener en cuenta en el Formulario público de reservas y en las diferentes zonas del dashboard donde se usa la disponibilidad para añadir o modificar citas)
            Si por ejemplo mis citas online duran 50 minutos y configuro 10 minutos de descanso entre sesiones. Ahora mis huecos de disponibilidad para configurar son de 60 minutos. Por tanto los pacientes por ejemplo pueden reservara las 9:00h, a las 10:00h, y así consecutivamente.

            Si mis citas presenciales duran 50 minutos y no tengo descanso entre sesiones. Ahora mis pacientes a nivel presencial pueden reservar a las 9:00h, a las 9:50h y así consecutivamente.
            Y además esto se debe tener en cuenta cuando añado manualmente una cita, o la modifico manualmente.
            Además cuando hago un cambio en mi duranacion de las sesiones o el tiempo de descanso entre sesiones, se debe avisar a la psicóloga de que debe volver a configurar y marcar sus huecos de disponibilidad semanales tanto online como presenciales.

        - Funcionalidad para añadir periodos de vacaciones:
            - Se podrán añadir varios periodos de vacaciones (fecha de inicio y fecha de fin)
            - Los campos de fecha e inicio serán un selector de fecha de html5.
            - Los periodos de vacaciones se podran borrar y añadir (tantos como queramos).
            - En el calendario de reservas publico (en el resto de sitios donde se use la disponibilidad de la psicologa) los dias que coincidan con esos periodos de vacaciones estarán "bloquedos" para que no se pueda reservar cita en esos rangos de fechas. 
            - Todos estos cambios se debe tener en cuenta en el Formulario público de reservas y en las diferentes zonas del dashboard donde se usa la disponibilidad para añadir o modificar citas.
            - Esta funcionalidad irá aparte del "Modo vacaciones" general (que se puede activar o desactivar y ya está indicado)
            - El panel de "Modo vacaciones" y el .panel de "Periodos de vacaciones" estarán uno al lado del otro. 

    - Gestionar todas las citas, podiendo añadir nuevas, editar y eliminarlas. Se podrán visualizar en una seccion con un listado paginado con diferentes filtros y tambien en el calendario.
    - Validación de solapamientos: además del frontend, la base de datos debe impedir que dos citas activas se pisen (restricción de exclusión sobre el rango de fechas).


### FASE 5:
- Dentro del panel de administración:
    - Calendario con las citas del sistema de reservas de citas y posibilidad de añadir manualmente (tipo Google Calendar). Si hay algun plugin o libreria de javascript famosa y recomendable para esto, https://calendarjs.com/ puede ser una buena opción. Adaptalo a nuestro sistema. Antes de integrarla, comprueba que funciona bien con React/Next (cargada solo en cliente); si no, propón una alternativa (por ejemplo FullCalendar) y pide autorización.

# FASE 6:
- Dentro del panel de administración:
    - Gestion del Blog. Con su crud y a cada articulo se le puede subir una imagen y se le puede vincular una categoria (que se pueden administrar, aparte de las creadas por defecto (crea las mas adecuadas))

    - Todos los campos de texto grandes en el dashboard deben tener incluido algun editor de texto wysiwyg para hacer agradable la edición (por ejemplo: https://xdsoft.net/jodit/)

    - Instala el editor con npm usando el paquete oficial para React (`jodit-react`; comprueba en la documentación que es la opción actual) y cárgalo solo en cliente (dynamic import con `ssr: false`), incluyendo su CSS. Documentación: https://xdsoft.net/jodit/docs/docs/getting-started.html (versión de referencia del curso: 4.7.6).
    - El HTML generado por el editor se guarda en Supabase. Al mostrarlo (parte publica y dashboard) se sanea con DOMPurify (`isomorphic-dompurify`) y solo entonces se renderiza con `dangerouslySetInnerHTML`.

# FASE 7:
- Dentro del panel de administración:
    - Gestión de pacientes con los datos que pusieron al pedir cita (consultar la funcionalidad a desarrollar en la parte publica), con la posibilidad de añadir manualmente nuevos pacientes, editar los que hay para ampliar datos e información (mete los necesarios). El objetivo es que los pacientes al pedir cita mediante el sistema de reservas automaticamente se creen en este sistema de gestion, con los datos que ellos introdujeron, lo mas importante e obligatorio es el numero de telefono (dato de contacto, guardado limpio: solo numeros, sin espacios). El identificador del paciente es un id interno (UUID) que nunca cambia, y ademas cada paciente tiene un numero de ficha correlativo y legible (ej. P-0042) para que la psicologa lo localice rapido. El telefono NO es identificador ni es unico: varios pacientes pueden compartir telefono (familiares, parejas, menores con su tutor) y un paciente puede cambiar de numero. Las urls del panel usan el id interno, nunca el telefono. Al crear un paciente con un telefono que ya existe, avisar ("Ya existe un paciente con este telefono, ¿es la misma persona?") sin bloquear. Cada ficha permite exportar los datos del paciente y eliminarlos o anonimizarlos con confirmacion explicita (ver seccion Seguridad). Además, si por ejemplo la psicologa a agendado una cita con el paciente por telefono, email, whatsapp o en persona, podrá añadir este paciente y su cita de forma manual.

    - Al crear una cita manualmente, implementar un buscador de pacientes en el campo del nombre del paciente (busca por nombre, telefono o numero de ficha) y al darle click que se rellenen los datos de la cita. Si el paciente al cual le estamos dando cita no existe en la tabla de pacientes, crearlo a la vez que creamos la cita y vincular esa cita con ese paciente.

 ### FASE 8:
 - Dentro del panel de administracion:
    - Gestión de historias (seguimiento de sesiones del paciente con posibilidad de escribir y subir fotos o pdfs). El objetivo de esto es que cada paciente, tenga su historia o su ficha, y la psicologa pueda (despues de cada sensión de terapia que tenga con el paciente), escribir en su historia acerca de la sesión de hoy, subir fotos o documentos pdf escaneados con las anotaciones de la terapia de ese dia.
    - Los archivos (fotos y PDFs) se guardan en el bucket privado `clinical-files` de Supabase Storage y se muestran con URLs firmadas de corta duración. Nunca son públicos.

### FASE 9:
- Dentro del panel de administracion:
    - Documentos de política de protección de datos (configuración de plantilla y botón de generar pdf con los datos del paciente):
        - Pagina de configuracion de la plantilla con editor wysywig (boton para descargar plantilla vacia en pdf)
        - En la pagina del detalle del paciente, a parte de poder meter mas info de el, tendremos un botón para descargar el pdf de la proteccion de datos ya relleno con sus datos.
    - El PDF se genera en el navegador sin librerías extra: vista imprimible con CSS de impresión y "Guardar como PDF". Si no queda bien, proponer jsPDF y pedir autorización.

### FASE 10:
- Dentro del panel de administracion:
    - Gestión de preguntas frecuentes para los pacientes

### FASE 11:
- Dentro del panel de administracion:
    - Configuración de toda la información que se muestra publicamente y que anteriormente se rellenó "provisionalmente" en el asistente.


### FASE 12:
- Dentro del panel de administracion:
    - Gestión de temas con 5 plantillas diferentes, simplemente se podrán seleccionar y automaticamente se activará una nueva apariencia en la web. Debe existir un boton que ponga ¿Quieres un diseño personalizado? Pidemelo aquí. Y que lleve aqui: https://victorroblesweb.es/contacto

    - Los temas se podrán seleccionar en formato landing (pagina larga) o multipaginas (diferentes secciones navegables).

    - Al darle click al tema se podrá ver una pequeña previsualización con los datos que ha rellenado la psicologa en el asistente (abrir una pestaña nueva con la previsualización del tema)

    - Los las plantillas de los temas se guardarán en una carpeta de "themes" para facilmente poder modificarlos o añadir nuevos y que sea todo muy plug and play. Cada tema es una carpeta `src/themes/<nombre>/` con sus componentes React y sus CSS (CSS Modules), registrada en un índice de temas. Cada tema redefine solo las variables de color con significado definidas en la FASE 0C.

        

### FASE 13:
- Dentro del panel de administracion:
    - Gestión de imagenes, se podrán gestionar todas las imagenes estaticas que aparecen en la parte publica de la web. (habrá huecos en los temas visuales que apareceran imagenes de prueba que aparecen por ejemplo en el "tema-visual-base", pero se podrán subir imagenes que a nivel programatico tendrian prioridad para renderizarse en la web)
    - Las imagenes subidas se guardan en el bucket público `public-images` de Supabase Storage y la tabla `site_images` indica qué imagen ocupa cada hueco (si no hay, se usa la de stock). Configurar el dominio de Supabase Storage en `next.config` para poder usar `next/image`.

### FASE 14: 
- Dentro del panel de administracion:
    - Opción de tema claro y tema oscuro en el panel (al marcar uno de los dos, se quedará persistente, aunque me desloguee, cierre el navegador etc):

        - Cuando le demos click al boton de tema claro/oscuro aparecerá una ventana modal, cono selector de los colores mas relacionados con la psicologia, que haya 8 colores muy aestetic para que el usuario pueda seleccionar (uno será el azul que tenemos en el dashboard), para que actue como color principal del dashboard (que se adapte toda la paleta de colores a ese tema).

        - En la ventana modal de seleccion de tema claro / oscuro del dashboard, se podrá seleccionar si queremos un tema claro o oscuro y el color primario para el dashboard y se guardará y persistirá (se quedará persistente, aunque me desloguee, cierre el navegador etc).

    - Casi todas las opciones de la web serán activables y desactivables (blog, sistema de reservas, faq, etc, porque habrá psicologas que quizas no las quieran)
    - Las preferencias del panel (tema claro/oscuro y color primario) se guardan en `dashboard_preferences` y también en una cookie para aplicarse desde el servidor sin parpadeo al cargar. Las secciones activables/desactivables se guardan en `site_settings`.

    
        
### FASE 15:
- Dentro del panel de administracion:

    - Crear una seccion de configuración de "Frases publicas" donde se puedan configurar todos los strings o frases que aparecen por defecto en los temas visuales para que la psicologa los pueda personalizar.
    
    - Hacer las secciones de configuración de redes sociales donde la psicologa podrá poner todos los enlaces a las diferentes redes sociales para que aparezcan en la parte publica de la web.

    - Hacer la seccion de "Email y notificaciones" (revisa la FASE 17 donde explico la necesidad que tenemos: indicar un email de gmail para que el sistema envíe un email a ese mismo email con las nuevas reservas, mediante una Server Action de Next con nodemailer).

    - En el header del dashboard poder darle click al nombre / avatar de la psicologa, para tener una sección donde podemos cambiar los datos privados de la psicologa (nombre de la psicologa, email interno/privado, telefono interno/privado, poder modificar la contraseña y poder subir un avatar). Incluye activar la verificación en dos pasos y pide la contraseña actual para cambios sensibles (ver sección Seguridad).

    - Hacer el buscador general que tenemos en el header del dashboard y que al buscar nos lleve a una página especial donde nos filtre y nos encuentre las conicidencias en citas, pacientes, historias, blog, etc (se creativo y haz algo muy util para el usuario)

    - En el botón Ayuda del header del dasboard, que tenga un hover y que lleve a una sección donde expliques con un tutorial general en texto y de forma sencilla de entender como funciona el dashboard de PsicoCMS completo.

    - Añadir un boton para ir a ver la parte publica de la web en la barra lateral.
    - Sección de privacidad: texto de la política de privacidad editable con wysiwyg y versionado, enlazado desde el formulario de reserva (ver sección Seguridad).

### FASE 16: 
- En la parte publica:

    - SEO con Next: `generateMetadata` por página, `sitemap.ts`, `robots.ts`, JSON-LD (profesional/negocio local y artículos), páginas renderizadas en servidor y revalidadas (`revalidatePath` / `revalidateTag`) cuando la psicologa cambia contenido en el panel.
    - Tendremos la información de la psicologa
    - Botones para pedir cita, llamar, contactar por whatsapp o mandar email.
    - Basate en la estructura de "tema-visual-base" (que tiene todas las opciones que una web de este tipo podria llegar a a tener), quedate con las secciones necesarias para nuestro caso.

    - Si la psicologa elije el tema en modo landing, será toda la web en una sola página con scroll suavizado, si no, la web tendrá secciones bien diferenciadas:
        - Inicio con una landing page agradable y con los datos más estrictamente nesarios (basate en el tipo de web de la carpeta "tema-visual-base") - en una url
        - Seccion sobre mi - en otra url
        - Seccion servicios - en otra url
        - Seccion blog - en otra url
        - Seccion preguntas frecuentes - en otra url y quizas incluida 
        - Seccion Pide cita - en otra url (dentro, en un lado tendremos toda la parte de hacer reservas, y en otro lado, con algo menos de importancia, tendremos un ¿Donde estamos?, con la direccion, y un mapa de google maps con ella, además del numero de telefono y datos de contacto)

### FASE 17:
- En la parte publica:
    - Seccion de reservas de citas:
        - Las reservas públicas NO escriben directamente en las tablas: pasan por Server Actions que llaman a las funciones RPC `get_available_slots` y `create_public_booking`. El visitante anónimo nunca puede leer pacientes ni citas. `create_public_booking` solo la ejecuta `service_role`. La Server Action aplica honeypot o captcha, límite de intentos y validación de datos (ver sección Seguridad).
        - Selector para elegir si la cita es presencial u online (en función de eso, y segun la disponibilidad que la psicologa tenga configurada para sus citas presenciales y su disponiblidad online, el calendario siguiente aparecerá adaptado. Las disponibilidad que la psicologa va a tener online y presenciales son diferentes y podrá configurarlas por separado)
        - Calendario para seleccionar el dia (segun las disponibilidad que tenga la psicologa configurada, ella podrá seleccionar los dias de disponiblidad y horarios semanales)
        - El paciente podrá rellenar su nombre (obligatorio), numero de telefono (obligatorio y validar que solo se puedan poner numeros) y motivo de la consulta (opcional) (en base a esto se le creará su "ficha de paciente" con un id interno único (UUID). El telefono se limpia programaticamente (todo junto, sin espacios, solo numeros) y se guarda como dato de contacto, no como identificador. Si ya existe un paciente con ese mismo telefono y el mismo nombre (sin distinguir mayúsculas ni acentos) se reutiliza su ficha; si el nombre es distinto se crea una ficha nueva, marcada para que la psicologa pueda revisar el posible duplicado en el panel). El formulario incluye una casilla obligatoria de aceptación de la política de privacidad (con enlace) y se guarda la fecha y versión del consentimiento.
        - Ventana modal de consulta agendada correctamente con boton de agendar en su calendario de google calendar por ejemplo (hazlo si hay una forma simple de hacerlo sin necesidad de usar apis).
        - Enviar un email a la psicologa avisando de que tiene una nueva cita (si tiene configuradas las notificaciones por email con un correo de gmail). El email no incluye el motivo de la consulta ni datos de salud, solo nombre, fecha, hora y modalidad. Se envía desde la propia Server Action de la reserva (nodemailer con SMTP de Gmail y una contraseña de aplicación), leyendo `email_settings` con el cliente admin de servidor. La reserva nunca debe fallar si el email falla. En la seccion de configuracion habrá un formulario con los datos necesarios (email de Gmail y contraseña de aplicación) y un mini tutorial para explicar a la psicologa como conseguirlos. La contraseña de aplicación se guarda en una tabla restringida (o Supabase Vault), nunca se devuelve al frontend una vez guardada y solo la lee el servidor.

    ### FASE 18:
    - En la parte publica:
        - Seccion de blog con los articulos paginados y su correspondiente filtrado por categorias (si la psicologa tiene activada esta seccion de blog, se podrá activar o desactivar desde el dashboard, al igual que tendrá un crud de articulos)

        - Botones de redes sociales en el footer (configurables las diferentes redes en el panel de administración)


---


## Stack de tecnologia:

- Framework: Next.js (última versión estable, App Router) con React y TypeScript estricto
- CSS nativo: CSS global por tema y para el dashboard + CSS Modules por componente (basate en el codigo de la carpeta "tema-visual-base"). Sin Tailwind ni librerías de UI.
- Backend: Supabase (no hay PHP, no hay Laravel, no hay MySQL):
    - Base de datos PostgreSQL
    - Supabase Auth (usuario único)
    - Supabase Storage (imágenes y archivos)
    - Row Level Security (RLS) como última capa de seguridad
    - Funciones RPC (PL/pgSQL) para la lógica sensible (reservas, huecos, verificación)
- Lógica de servidor en Next: Server Actions y Route Handlers (instalación inicial, login, reservas y email). No se usan Edge Functions de Supabase.
- Clientes de Supabase: `@supabase/supabase-js` y `@supabase/ssr`, con tres clientes: navegador, servidor y admin (`service_role`, solo servidor).
- Email: nodemailer con SMTP de Gmail (contraseña de aplicación).
- Librerías autorizadas: supabase-js, @supabase/ssr, isomorphic-dompurify, jodit-react (editor wysiwyg), librería de calendario (CalendarJS o alternativa aprobada), nodemailer y Font Awesome (fuente local). Cualquier otra requiere autorización.
- Despliegue: Vercel (u otro hosting Node compatible con Next). Variables de entorno configuradas en el hosting.
- SEO: las páginas públicas se renderizan en servidor con metadatos, sitemap y JSON-LD (ver FASE 16).

---

## Preferencias generales:
- Todos los textos visibles en la web deben estar en español y el agente tambien debe comunicarse conmigo en Español.
- Usa todoas las imagenes de stock de "tema-visual-base" para tener algo de imagenes en las plantillas. Luego estas imagenes podran editarse o cambiarse en una sección del dashboard.

---

## Preferencias de diseño para la parte publica:

- Basate en el diseño de la carpeta "tema-visual-base"
- Los colores del tema se definen con variables con significado (ver FASE 0C) para que cada tema nuevo solo redefina ese conjunto.
- Un único `h1` por página, jerarquía de títulos correcta y textos de relleno sustituidos por datos configurables.
- Todos los temas siguen las mismas reglas de peso: fuentes en WOFF2 con solo los pesos necesarios e imágenes optimizadas.

---

## Preferencias de diseño para la parte privada:

- Crea un diseño de un dashboard visualmente agradable, sencillo de entender y muy intuitivo para una psicologa, que no son usuarios avanzados de informatica (ten en cuenta todas las funcionalidades e inspirate mucho en la carpeta "dashboard-design" que tienes en la raiz del proyecto, dentro de esa carpeta tienes un prototipo de diseño, puede tener fallos, pero la idea y el concepto es muy similar a lo que necesitamos, hay diferentes pantallas diseñadas para inspirarte en ellas e intentar imitarlas y mejorarlas. En el diseño hay ciertos datos que están mal, como el nombre del cms, algunos textos en ingles, etc, ten criterio y ten muy en cuenta las funcionalidades descritas en este documento)

### Reglas sobre los recursos de diseño del panel
- Ante cualquier conflicto entre las imágenes de "dashboard-design" y las especificaciones de este documento, mandan las especificaciones. Las imágenes son inspiración visual, no funcional.
- Todos los textos del panel en español y el producto se llama PsicoCMS. Las imágenes tienen textos en inglés (New Session, Patients, Calendar, Availability, Help Center, Logout) y el nombre "Sanctuary CMS": traducir y sustituir (Nueva cita, Pacientes, Calendario, Disponibilidad, Centro de ayuda, Cerrar sesión).
- Disponibilidad: el diseño muestra una sola duración y rangos horarios por día. Manda la especificación (FASE 4): duración y descanso por modalidad (online y presencial), semana de 7 días con horas marcables con clic, modo vacaciones y periodos de vacaciones.
- Pacientes: el teléfono debe ser visible en el listado y en la ficha, junto al número de ficha. El filtro de "Género" del diseño no se implementa. Un estado simple (activo/pausado) solo si resulta necesario, anotando la decisión en `MAP.md`.
- Inicio: la tarjeta de "Ingresos mensuales" no se implementa (no hay pagos en la especificación). Sustituirla por una métrica basada en datos reales, por ejemplo citas de la semana.
- Los nombres, fechas, cifras y fotos de ejemplo de las imágenes son solo ilustrativos: no se copian como datos reales (en el inicio se usan datos de prueba hasta que existan datos reales, FASE 4).
- El menú lateral del diseño muestra pocas opciones: el menú final se define según las funcionalidades de las FASES 3 a 15.

---


## Preferencias de estilos:

- Colores (cada tema visual puede tener diferentes, el "tema-visual-base" ya tiene los suyos y los del panel de administración los tienes en la carpeta "dashboard-design")
- Uso de medidas en rem, usando un font-size base de 10px
- Uso de HTML5 y CSS3 nativo.
- Uso de buenas practicas de maquetación css y si es necesario usa flexbox y css grid layout.
- Que la webapp sea responsive, tanto en la parte publica, como en el dashboard.

---


## Preferencias de código:
- No mezcles el código css entre los diferentes componentes, tengo bien separado para cada tema visual y para el dashboard. Si puedes tenerlo en una carpeta de css, como hago en la carpeta "tema-visual-base", mucho mejor.
- HTML debe ser semantico.
- La parte publica debe estar completamente optimizada para SEO (a nivel codigo y buenas practicas)
- Usa siempre let o const, y no uses nunca var.
- No uses alert, confirm o prompt, todo el feedback debe ser visual en el dom.
- Toda alerta o ventana modal que aparezca debe tener el mismo estilo que la web.
- No uses `dangerouslySetInnerHTML` salvo para HTML saneado (ver excepción más abajo); el resto del contenido se renderiza con JSX.
- Única excepción controlada: el HTML generado por el editor wysiwyg (blog, plantilla de protección de datos) se sanea con DOMPurify (`isomorphic-dompurify`) antes de usar `dangerouslySetInnerHTML`.
- TypeScript estricto, sin `any`. Componentes de servidor por defecto; `"use client"` solo donde haga falta interactividad.
- Todo el acceso a Supabase está centralizado en módulos de servicio (`src/services/*.ts`); los componentes de interfaz no llaman a Supabase directamente.
- Nunca escribas claves secretas en el código. Las claves van en variables de entorno (`.env.local`); solo las `NEXT_PUBLIC_` llegan al navegador y nunca la `service_role`.
- Cuidado con olvidar prevener el default en los eventos submit o click.
- Prioriza el codigo legible y mantenible.
- Prioriza que el codigo sea sencillo de entender.
- Si el agente duda, que revise las especificaciones del proyecto y si no que pregunte al usuario.


---

## Estructura de archivos:
- carpeta "tema-visual-base" (es una maquetación web de una de las plantillas o temas visuales de la web)
- carpeta "dashboard-design" (contiene unas imagenes con un diseño provisional para el dashboard)
- AGENTS.md, plan-implementacion.md, MAP.md, fixes.md, prompts.md
- `.agents/skills/`: skills propias del proyecto (`psicocms-seguridad`, `psicocms-citas`, `local-dates`, `psicocms-temas`, `psicocms-textos`), cada una en su carpeta con un `SKILL.md`
- `.opencode/commands/`: comandos personalizados (`/fase`, `/fixes`, `/estado`, `/migracion`, `/cerrar-fase`, `/auditoria`, `/probar-fase`, `/revisar-rls`, `/nueva-funcionalidad`, `/spec-revisar`, `/tema`, `/textos`, `/mapa`)
- `supabase/migrations/` (SQL numerado)
- `src/app/`: `(public)/`, `instalacion/`, `acceso-psicologa/`, `panel-psicologa/` (cada una con su layout)
- `src/lib/supabase/`: cliente de navegador, de servidor y admin (`server-only`)
- `src/actions/` (Server Actions), `src/services/` (acceso a datos), `src/themes/<nombre>/` (temas plug and play), `src/components/ui/` (componentes reutilizables)
- `public/` (fuentes de Font Awesome e imágenes de stock)
- `middleware.ts` (o `proxy.ts` según la versión de Next), `.env.local` y `.env.example`

---

## Fases del desarrollo:

- Estudia las caracteristicas del proyecto
- Ejecuta la FASE 0A (crear e inicializar el proyecto Next.js), después la FASE 0B (migraciones de Supabase: esquema, RLS, funciones, storage), guiándome para aplicarlas, y por último la FASE 0C (preparar los recursos visuales)
- Sigue las fases del desarrollo (especificadas en la seccion de funcionalidades de este fichero AGENTS.md) y para de trabajar despues de cada fase para poder probar lo que has desarrollado, corregir y mejorar algo si es necesario y poder continuar.
- Si crees que se puede optimizar, indicamelo en el plan de implementación.

---

## Otras consideraciones:

- Guarda el plan de implementación en `plan-implementacion.md` en la raiz del proyecto, con las fases y sus sub-tareas como checkboxes (esto sustituye a un tareas.md aparte). Marca cada sub-tarea al cumplirla.
- Mantén `MAP.md` en la raiz como mapa real del proyecto: estructura, tablas, funciones RPC, buckets, rutas y decisiones técnicas. Consúltalo antes de cualquier tarea y actualízalo tras cada cambio relevante.
- Los errores y mejoras que yo detecte al probar estarán en `fixes.md`.
- Guarda cada uno de los prompt nuevos que haga en un fichero prompts.md en la raiz del proyecto (todos ordenados uno detras de otro dentro del fichero), cada vez que yo haga un prompt aparte, guardalo ahí.
- Cada cambio en la base de datos es una migración nueva en `supabase/migrations/`; avísame siempre de que debo aplicarla.
- Antes de dar por terminada una fase que toque datos, permisos, archivos o autenticación, comprueba las reglas de la sección "Seguridad" y dime cuáles aplican.

---

## Modo implementación:
- Solo código, minimos comentarios, el codigo ya debe ser autoexplicativo.
- No expliques que hace el código en el chat del agente.
- Responde en español si preguntas, pero en prompts usa Ingles / Español libremente.
- Si hay ambigüedad, asume la decisión más simple que no rompa algo.