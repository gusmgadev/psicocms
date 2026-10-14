---
description: Ejecuta una fase del plan de PsicoCMS (uso: /fase 7)
---
Lee @AGENTS.md, @plan-implementacion.md y @MAP.md.
Ejecuta únicamente la FASE $ARGUMENTS del plan. Si la fase anterior no está marcada como completada en @plan-implementacion.md, avísame antes de empezar.

Jerarquía de conflicto:
1. @AGENTS.md (qué construir)
2. @plan-implementacion.md (cómo construirlo, orden obligatorio)
3. @MAP.md (estado real del sistema)

Reglas de ejecución:
- Consulta primero @MAP.md antes de empezar cualquier tarea.
- Ejecuta las tareas en orden exacto, sin saltarte ninguna y sin replantear el plan.
- No entres en modo de planificación, análisis global ni rediseño.
- No realices pruebas tú mismo: implementa y avísame cuando esté listo para validar.
- Solo pregunta si existe un bloqueo técnico real.
- Mantén los cambios dentro de la fase actual, salvo dependencia directa.

Skills:
- Usa las skills de .agents/skills/ que apliquen a la fase (psicocms-seguridad, psicocms-citas, local-dates, psicocms-temas, psicocms-textos) y dime cuáles usaste.
- Si una skill contradice a @AGENTS.md, manda @AGENTS.md.

Reglas de seguridad:
- Cumple la sección "Seguridad" de @AGENTS.md y dime cuáles aplican a esta fase.
- Toda política del rol authenticated usa is_owner().
- Toda función nueva revoca EXECUTE a PUBLIC y anon, salvo que deba ser pública. Dime quién puede ejecutarla y anótalo en @MAP.md.
- No guardes datos personales ni de salud en logs. No uses datos reales de pacientes.
- Valida siempre en servidor (y en la base de datos cuando proceda).

Reglas de Supabase y Next.js:
- Cambios en la base de datos: migración NUEVA en supabase/migrations/ (nunca edites las anteriores) y dime cómo aplicarla.
- La service_role solo se usa en servidor (import 'server-only', sin prefijo NEXT_PUBLIC_).
- El acceso a datos va en src/services/ y las mutaciones en Server Actions (src/actions/). Toda Server Action del panel verifica la sesión con getUser.
- Componentes de servidor por defecto; "use client" solo donde haga falta. TypeScript estricto, sin any. CSS nativo con CSS Modules, sin Tailwind.
- No instales librerías nuevas sin mi autorización.
- Si la fase cambia contenido público, revalida las páginas afectadas.

Reglas de diseño:
- Ante conflicto entre dashboard-design y @AGENTS.md, manda @AGENTS.md.
- Todos los textos visibles en español; el producto se llama PsicoCMS.
- Usa las variables de color con significado y los tokens del panel de la FASE 0C; sin colores fijos en componentes.
- Los pacientes se identifican por su id interno (UUID); el teléfono es dato de contacto, nunca identificador ni va en las urls.

Reglas SDD:
- Después de cada cambio relevante, actualiza @MAP.md (cambios, nuevos módulos/rutas/tablas/funciones, decisiones técnicas, impacto).
- No inventes estado en @MAP.md. Si hay discrepancia entre código y mapa, el código tiene prioridad y el mapa se corrige.

Salida esperada:
- Marca cada sub-tarea como completada en @plan-implementacion.md.
- Al finalizar: resume lo implementado, sincroniza @MAP.md, marca la fase como completada e indícame qué debo probar y si hay migraciones por aplicar.
