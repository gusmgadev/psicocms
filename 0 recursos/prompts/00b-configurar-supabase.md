# Prompt 00b: Preparar Supabase y la base de datos (FASE 0B)
Modelo recomendado: nemotron-3-ultra-free
Antes de lanzarlo: crea una cuenta en supabase.com y ten terminada la FASE 0A.

Lee @AGENTS.md, @plan-implementacion.md y @MAP.md.
Ejecuta únicamente la FASE 0B: preparación de Supabase y base de datos.

Reglas:
- Crea las migraciones SQL en supabase/migrations/ (numeradas, una por tema) con tablas, restricciones, RLS, funciones RPC y buckets de Storage, tal como describe @AGENTS.md.
- RLS activado en todas las tablas. El rol anon nunca puede leer pacientes, citas, historias, email_settings ni datos privados del perfil.
- Aplica la sección "Seguridad" de @AGENTS.md: is_owner() en todas las políticas, REVOKE EXECUTE a PUBLIC y anon en todas las funciones (create_public_booking y check_rate_limit solo para service_role), tabla rate_limit_events, email_settings sin lectura desde el cliente y buckets con límites de tipo y tamaño.
- No escribas código de la aplicación todavía, salvo generar los tipos TypeScript de la base de datos cuando las migraciones estén aplicadas.
- Guíame paso a paso, en español y sin asumir que conozco Supabase, para: crear el proyecto, desactivar el registro público, obtener la URL, la anon key y la service_role key (esta última solo para .env.local, nunca con prefijo NEXT_PUBLIC_), y ejecutar las migraciones.
- Al terminar: actualiza @MAP.md y marca la fase en @plan-implementacion.md. Avísame para validar.
