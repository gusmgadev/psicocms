# Prompt 00a: Crear e inicializar el proyecto Next.js (FASE 0A)
Modelo recomendado: nemotron-3-ultra-free o mimo-v2.5-free
Antes de lanzarlo: ten en la raíz AGENTS.md, /plan-implementacion.md, MAP.md y fixes.md, junto a las carpetas "tema-visual-base" y "dashboard-design".

Lee @AGENTS.md, @plan-implementacion.md y @MAP.md.
Ejecuta únicamente la FASE 0A: crear e inicializar el proyecto Next.js. No implementes ninguna funcionalidad todavía.

Reglas:
- Sigue exactamente lo descrito en la FASE 0A de @AGENTS.md (App Router, TypeScript, ESLint, src/, alias @/*, sin Tailwind, comandos no interactivos).
- Si la carpeta ya tiene archivos, créalo en una carpeta temporal y mueve el contenido sin sobrescribir mis archivos.
- Instala solo las dependencias indicadas. Cualquier otra, pídeme autorización.
- La service_role key solo existe en el servidor (sin prefijo NEXT_PUBLIC_, con import 'server-only'). Nunca en el cliente.
- En .env.example deja las variables (incluida INSTALL_TOKEN) sin valores reales; asegúrate de que .env.local no se sube a Git.
- Comprueba que npm run build compila y que el middleware (o proxy.ts, según la versión instalada) redirige /panel-psicologa a /acceso-psicologa cuando no hay sesión.
- Haz git init y primer commit si no existe repositorio.
- Al terminar: actualiza @MAP.md, marca la fase en @plan-implementacion.md y avísame para validar. No me expliques nada más.
