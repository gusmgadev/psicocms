---
name: psicocms-seguridad
description: Reglas de seguridad obligatorias de PsicoCMS (Next.js + Supabase con datos de salud). Úsala SIEMPRE que se cree o modifique una migración SQL, una política RLS, una función RPC, un bucket de Storage, una Server Action, el login, la instalación, la reserva pública, el envío de email, la subida de archivos o cualquier cosa que toque pacientes, citas, historias clínicas, claves o variables de entorno, aunque el usuario no mencione la palabra seguridad.
---

# PsicoCMS: seguridad

La sección "Seguridad" de `AGENTS.md` es la fuente de verdad. Esta skill es la lista de comprobación operativa. Si hay conflicto con otra skill o con tu criterio, manda `AGENTS.md`. Ante la duda, pregunta antes de implementar.

## Antes de cerrar cualquier tarea, comprueba

### Base de datos (migraciones nuevas, nunca editar las ya aplicadas)
- [ ] Toda tabla nueva tiene RLS activado y políticas explícitas.
- [ ] Las políticas del rol `authenticated` usan `is_owner()`, no solo "estar autenticado".
- [ ] `anon` solo lee contenido público (servicios, FAQs, artículos publicados, etc.). Nunca `patients`, `appointments`, `clinical_*`, `email_settings` ni datos privados del perfil.
- [ ] Toda función nueva revoca `EXECUTE` a `PUBLIC` y `anon` y lo concede solo a quien corresponde.
- [ ] Las funciones `SECURITY DEFINER` fijan `search_path` y no devuelven datos de más.
- [ ] `create_public_booking` y `check_rate_limit` solo las ejecuta `service_role`.
- [ ] Documentado en `MAP.md` quién puede ejecutar cada función.

Plantilla para funciones:

```sql
create or replace function public.mi_funcion(...)
returns ...
language plpgsql
security definer
set search_path = public
as $$
begin
  -- validar entradas, devolver lo mínimo
end;
$$;

revoke execute on function public.mi_funcion(...) from public, anon;
grant execute on function public.mi_funcion(...) to authenticated; -- o service_role
```

Plantilla para `is_owner()` (ajusta el nombre real de la columna que enlaza con `auth.users`):

```sql
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.professional_profile where user_id = auth.uid());
$$;

revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;
```

Política tipo: `using (public.is_owner()) with check (public.is_owner())`.

### Claves y servidor
- [ ] `service_role` solo en servidor (`import 'server-only'`, variable sin `NEXT_PUBLIC_`). Nunca en componentes de cliente, en el bundle ni en Git.
- [ ] Toda Server Action y Route Handler del panel verifica la sesión con `getUser()` antes de actuar. El middleware no basta.
- [ ] La contraseña de Gmail se guarda en Vault o cifrada, solo se escribe desde una Server Action y solo la lee el servidor. La interfaz muestra "contraseña guardada".

### Autenticación e instalación
- [ ] Contraseña de al menos 12 caracteres. Límite de intentos por IP y email. Mensajes de error genéricos.
- [ ] El teléfono NO es un segundo factor (es público). Segundo factor real: TOTP, si Supabase lo permite.
- [ ] Recuperación de contraseña con la misma respuesta exista o no la cuenta.
- [ ] `/instalacion` exige `INSTALL_TOKEN` y se bloquea al terminar.
- [ ] Cambiar contraseña o email pide la contraseña actual.

### Reserva pública
- [ ] Solo pasa por la Server Action (nunca llamada directa a Supabase con la anon key).
- [ ] Honeypot o captcha (pedir autorización antes de añadir uno), límite por IP y por teléfono, máximo de citas futuras por teléfono.
- [ ] Validación en servidor con límites de longitud, rechazo de fechas pasadas y revalidación dentro del RPC.
- [ ] Respuesta genérica: no revela si el teléfono ya existía.
- [ ] Casilla de privacidad obligatoria; se guarda `consent_at` y `consent_version`.
- [ ] El email de aviso NO incluye el motivo de la consulta: solo nombre, fecha, hora y modalidad.

### Archivos y contenido
- [ ] Límites en el bucket y validación en servidor (tipo real y tamaño): `public-images` jpg/png/webp sin SVG hasta 5 MB; `clinical-files` imágenes y PDF hasta 15 MB; `avatars` imágenes hasta 2 MB.
- [ ] Nombres de archivo generados (UUID). Archivos clínicos bajo ruta con el id del paciente y URLs firmadas de unos 60 segundos.
- [ ] Todo HTML de editores wysiwyg (blog, protección de datos, historias) se sanea con DOMPurify antes de `dangerouslySetInnerHTML`.

### Aplicación y datos
- [ ] Sin datos personales ni de salud en logs ni mensajes de error. Sin analíticas de terceros sin consentimiento.
- [ ] Cabeceras de seguridad (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy, HSTS) en producción.
- [ ] Nunca datos reales de pacientes en desarrollo o pruebas.
- [ ] Exportar y eliminar o anonimizar datos de un paciente con confirmación explícita.

## Al terminar
Resume en 3 o 4 líneas qué puntos de esta lista aplicaban a la tarea y cuáles quedan pendientes. No inventes que algo está comprobado si no lo verificaste.
