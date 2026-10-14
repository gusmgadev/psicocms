---
description: Revisión rápida de RLS y permisos tras tocar la base de datos (uso: /revisar-rls)
agent: plan
---
Lee @MAP.md y las migraciones de supabase/migrations/. No modifiques nada.
Revisa solo esto y responde con una lista corta:
1. Tablas sin RLS activado.
2. Políticas del rol authenticated que no usen is_owner().
3. Políticas o grants que den al rol anon acceso a pacientes, citas, historias, email_settings o datos privados.
4. Funciones sin REVOKE EXECUTE a PUBLIC y anon, o con permisos de más. Indica quién puede ejecutar cada una.
5. Funciones SECURITY DEFINER sin search_path fijado.
6. Buckets sin límites de tipo o tamaño.
Si todo está bien, dilo en una línea. Si hay fallos, indica la migración y la línea.
