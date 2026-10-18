# Skills recomendadas para PsicoCMS

Las 5 skills propias ya vienen en `.agents/skills/`. Esta lista son skills de terceros, de fuentes oficiales, que conviene añadir.

## Antes de instalar cualquiera
- Lee su `SKILL.md` completo. Una skill es una instrucción que el agente va a obedecer.
- Instala solo de fuentes oficiales (Anthropic, Vercel, Supabase). Evita instaladores de terceros que empaquetan muchas skills a la vez.
- No instales muchas: con 5 o 6 en total es suficiente.
- Ante conflicto con una skill, manda `AGENTS.md` (ya lo dice el propio documento).
- Comprueba en la documentación de tu herramienta en qué carpeta busca skills.

## Cuándo instalar cada una

| Skill | Origen | Para qué | Instalar antes de |
|---|---|---|---|
| `next-best-practices` | Vercel | App Router, Server Components, caché y streaming | FASE 0A |
| `frontend-design` | Anthropic | Diseño distintivo, evitar el aspecto genérico | FASE 0C |
| `supabase` | Supabase | Uso correcto de Supabase y seguridad básica | FASE 0B |
| `supabase-postgres-best-practices` | Supabase | RLS, esquema, índices y rendimiento | FASE 0B |
| `web-design-guidelines` | Vercel | Auditoría de UI: accesibilidad, formularios, modo oscuro | FASE 3 |
| `react-best-practices` | Vercel | Rendimiento en React y Next.js | Cuando haya pantallas pesadas (FASE 4 en adelante) |
| `playwright-best-practices` | Comunidad | Pruebas de extremo a extremo | Después de la FASE 17 (opcional) |

## Instalación
Según el repositorio de Supabase, el comando es:

```
npx skills add supabase/agent-skills
```

Para las de Vercel y Anthropic, usa el README de cada repositorio oficial. Confirma siempre el comando actual en su documentación.

## Skills propias del kit
- `psicocms-seguridad`: lista de comprobación de seguridad.
- `psicocms-citas`: disponibilidad, reservas, solapamientos y pacientes.
- `local-dates`: fechas, zonas horarias y cambios de hora.
- `psicocms-temas`: cómo crear y registrar temas visuales.
- `psicocms-textos`: idioma, tono, traducciones y formatos de interfaz.
