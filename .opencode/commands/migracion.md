---
description: Crea una migración SQL nueva cumpliendo la seguridad (uso: /migracion <qué cambio necesitas>)
---
Lee @AGENTS.md (sección "Seguridad") y @MAP.md.
Crea una migración NUEVA en supabase/migrations/ (numerada a continuación de la última, nunca edites una anterior) para este cambio: $ARGUMENTS

Reglas:
- Usa la skill psicocms-seguridad.
- Toda tabla nueva con RLS activado y políticas explícitas. Las políticas del rol authenticated usan is_owner().
- El rol anon solo puede leer contenido público. Nunca pacientes, citas, historias clínicas, email_settings ni datos privados del perfil.
- Toda función nueva fija search_path, valida las entradas, y revoca EXECUTE a PUBLIC y anon, concediéndolo solo a quien corresponda.
- Si el cambio afecta a fechas o citas, aplica también local-dates y psicocms-citas.
- No escribas código de la aplicación, solo la migración.

Al terminar:
- Dime exactamente cómo aplicarla (SQL Editor de Supabase o CLI), en pasos cortos.
- Actualiza @MAP.md (tablas, funciones y quién puede ejecutar cada una).
- Si el cambio hace necesario regenerar los tipos de TypeScript, dímelo.
