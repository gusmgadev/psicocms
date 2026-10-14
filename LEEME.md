# Kit PsicoCMS v2 (Next.js + Supabase)

Copia a la raíz de tu proyecto: AGENTS.md, plan-implementacion.md, MAP.md y fixes.md.
Copia también las carpetas ocultas `.agents/` y `.opencode/` (contiene las 5 skills propias del proyecto). Activa "mostrar archivos ocultos" si no la ves.
Junto a ellos deben estar tus carpetas "tema-visual-base" y "dashboard-design". La infografía "spec driven development" del zip de recursos no va dentro del proyecto.

Orden de uso:
1. (Opcional) 06-revisar-spec: revisa AGENTS.md antes de empezar.
2. (Opcional) 01-revisar-plan: revisa el borrador de plan-implementacion.md.
3. 00a-crear-proyecto-next (FASE 0A).
4. Crea tu cuenta en supabase.com y lanza 00b-configurar-supabase (FASE 0B).
5. Lanza 00c-preparar-recursos (FASE 0C): limpia el tema base y extrae los tokens del panel.
6. Por cada fase siguiente: 03-entre-fases -> probar -> anotar en fixes.md -> 04-corregir-fixes -> git commit.
7. Antes de publicar: 07-auditoria-seguridad.
8. Funcionalidades nuevas: 05-nueva-funcionalidad.

Comandos: en .opencode/commands/ hay 13 comandos personalizados que equivalen a los prompts de la carpeta prompts/. Se ejecutan escribiendo /nombre en OpenCode:
- /fase 7 : ejecuta una fase (prompt 03)
- /fixes : corrige fixes.md (prompt 04)
- /estado : resume en qué punto estás
- /migracion <cambio> : crea una migración nueva con las reglas de seguridad
- /cerrar-fase 7 : cierra una fase ya probada y propone el commit (no lo ejecuta)
- /auditoria : auditoría de seguridad, solo informe (prompt 07)
- /probar-fase 7 : genera tu lista manual de pruebas
- /revisar-rls : revisión rápida de permisos tras tocar la base de datos
- /nueva-funcionalidad <nombre> : añade fases al plan (prompt 05)
- /spec-revisar : revisión QA de AGENTS.md (prompt 06)
- /tema <nombre> : crea un tema visual nuevo
- /textos : busca textos en inglés, tildes faltantes y nombres fijos
- /mapa : regenera MAP.md (prompt 02)
Los comandos con agent: plan son de solo lectura. No llevan modelo fijo: elígelo tú con /models. Copia también la carpeta oculta .opencode/. Comprueba en la documentación de tu versión de OpenCode si la carpeta se llama commands o command. Los prompts de prompts/ siguen sirviendo con cualquier otro agente.

Skills: las propias están en .agents/skills/. Las de terceros recomendadas, con cuándo instalarlas, están en skills-recomendadas.md. Comprueba en la documentación de tu herramienta en qué carpeta busca las skills y si distingue mayúsculas (el estándar usa SKILL.md).

Nota: el fichero de especificación se llama AGENTS.md. Los prompts lo referencian con @AGENTS.md, así que funcionan con cualquier agente. Si tu herramienta carga automáticamente otro nombre de fichero de reglas, comprueba en su documentación si lee AGENTS.md.
