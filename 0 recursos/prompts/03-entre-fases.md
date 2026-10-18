# Prompt 03: Ejecutar una fase (se repite en cada fase)
Modelo recomendado: Sonnet (Opus si la fase es compleja o larga)
Cambia solo los números de fase.

He terminado la FASE 0.
Ahora procede a hacer la FASE 1.

Contexto:
- Especificación en @AGENTS.md (fuente de verdad funcional)
- Plan de implementación en @plan-implementacion.md (orden de ejecución obligatorio)
- Estado actual del sistema en @MAP.md (fuente de verdad del estado real)
- Debes seguir el plan de implementación estrictamente, sin replantearlo.

Jerarquía de conflicto:
1. @AGENTS.md (qué construir)
2. @plan-implementacion.md (cómo construirlo)
3. @MAP.md (estado actual del sistema)

Reglas de ejecución:
- Consulta primero @MAP.md antes de empezar cualquier tarea.
- Ejecuta las tareas en orden exacto, sin saltarte ninguna.
- No entres en modo de planificación, análisis global ni rediseño.
- No realices pruebas tú mismo: implementa y avísame cuando esté listo para validar.
- Solo pregunta si existe un bloqueo técnico real que impida continuar.

Reglas de Supabase:
- Si la fase necesita cambios en la base de datos, crea una migración NUEVA en supabase/migrations/ (nunca edites las anteriores) y dime exactamente cómo aplicarla.
- Toda tabla nueva con RLS activado y sus políticas.
- La service_role key solo se usa en servidor (import 'server-only', sin prefijo NEXT_PUBLIC_). Nunca en componentes de cliente.
- El acceso a datos va en src/services/ y las mutaciones en Server Actions (src/actions/); los componentes no llaman a Supabase directamente.

Skills:
- Usa las skills de .agents/skills/ que apliquen a la fase (psicocms-seguridad, psicocms-citas, local-dates, psicocms-temas, psicocms-textos) y dime cuáles usaste.
- Si una skill de terceros contradice @AGENTS.md, manda @AGENTS.md.

Reglas de seguridad:
- Cumple la sección "Seguridad" de @AGENTS.md y dime cuáles aplican a esta fase.
- Toda política del rol authenticated usa is_owner().
- Toda función nueva revoca EXECUTE a PUBLIC y anon, salvo que deba ser pública. Dime quién puede ejecutarla y anótalo en @MAP.md.
- No guardes datos personales ni de salud en logs. No uses datos reales de pacientes.
- Valida siempre en servidor (y en la base de datos cuando proceda).

Reglas de diseño:
- Ante conflicto entre dashboard-design y @AGENTS.md, manda @AGENTS.md.
- Todos los textos visibles en español; el producto se llama PsicoCMS.
- Usa las variables de color con significado y los tokens del panel definidos en la FASE 0C; no pongas colores fijos en los componentes.
- Los pacientes se identifican por su id interno (UUID); el teléfono es un dato de contacto, nunca un identificador ni va en las urls.

Reglas de Next.js:
- Componentes de servidor por defecto; "use client" solo donde haga falta interactividad.
- Toda Server Action del panel verifica la sesión en el servidor (getUser) antes de actuar.
- TypeScript estricto, sin any. CSS nativo con CSS Modules, sin Tailwind.
- No instales librerías nuevas sin mi autorización.
- Si una fase cambia contenido público, revalida las páginas afectadas (revalidatePath / revalidateTag).

Reglas SDD obligatorias:
- Después de cada cambio relevante, actualiza @MAP.md con:
  - cambios realizados
  - nuevos módulos / rutas / tablas / funciones / entidades
  - decisiones técnicas tomadas
  - impacto en el sistema

Control de consistencia:
- No inventes estado en @MAP.md.
- Si hay discrepancia entre código y mapa, el código tiene prioridad y el mapa debe corregirse.

Alcance:
- Mantén los cambios dentro de la fase actual.
- No modifiques funcionalidades fuera del scope de la fase, salvo dependencia directa.

Salida esperada:
- Marca cada sub-tarea como completada en @plan-implementacion.md.
- Al finalizar la fase:
  - resume lo implementado
  - sincroniza completamente @MAP.md con el estado real del sistema
  - marca la fase como completada
  - indícame qué debo probar y si hay migraciones por aplicar
