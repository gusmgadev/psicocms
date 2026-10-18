---
name: psicocms-temas
description: Cómo crear, adaptar y registrar un tema visual de la web pública de PsicoCMS (los 5 temas plug and play, variables de color con significado, un solo h1, rem con base de 10px, CSS Modules sin Tailwind, fuentes WOFF2, modo landing o multipágina). Úsala siempre que se cree o modifique un tema, un componente de la web pública, estilos, colores, tipografía o el selector de temas (FASES 0C, 1, 12, 13, 16), aunque el usuario solo pida "cambiar el diseño" o "hacer otro estilo".
---

# PsicoCMS: temas visuales

`AGENTS.md` manda. El tema base sale de `tema-visual-base` ya limpiado en la FASE 0C. Los otros cuatro temas se construyen a partir de él.

## Estructura de un tema
```
src/themes/<nombre>/
├── componentes React del tema (cabecera, inicio, servicios, blog, FAQ, reservas, pie)
├── *.module.css            (CSS Modules por componente)
├── tokens.css              (variables de color y tipografía del tema)
└── assets/                 (imágenes propias del tema, en WebP)
```
- Cada tema está registrado en el índice de temas y en la tabla de datos iniciales (seed). El tema activo se guarda en `site_settings`.
- Nunca mezcles el CSS de un tema con el de otro ni con el del panel.

## Orden para crear un tema nuevo
1. **Copia el tema base** y cambia el nombre.
2. **Cambia primero solo los tokens** (`tokens.css`): colores y tipografía. Un tema bien hecho cambia mucho solo con esto.
3. Solo después adapta layout, espaciados y componentes específicos del tema.
4. Registra el tema (índice y seed) y pruébalo con el selector de la FASE 12 y su previsualización en pestaña nueva.

## Tokens
- Usa las variables con significado definidas en la FASE 0C y documentadas en `MAP.md` (primario, primario oscuro, fondo, fondo alterno, texto, texto suave, borde). **Los componentes no llevan colores fijos**, solo `var(--...)`.
- Cada tema redefine únicamente ese conjunto reducido. Si necesitas una variable nueva, añádela al conjunto común para todos los temas y anótalo en `MAP.md`.

## Reglas de calidad
- Un único `h1` por página; jerarquía de títulos coherente (`h2`, `h3`).
- CSS nativo con CSS Modules. **Sin Tailwind ni librerías de UI.** `font-size` base del `html` en 10px y medidas en `rem`.
- Fuentes en WOFF2 con `next/font/local` y solo los pesos usados. Imágenes en WebP, con `alt`, y `next/image` con el dominio de Supabase Storage configurado.
- Contraste de texto suficiente (mínimo 4,5:1 para texto normal) y foco visible en enlaces, botones y formularios.
- Responsive: comprueba al menos móvil, tableta y escritorio. Menú móvil usable con teclado.
- Los datos (nombre, especialidades, planes, horarios, redes, frases públicas) vienen de la base de datos, nunca fijos en el tema. Los textos de relleno se sustituyen por datos configurables.
- Soporta los dos modos: **landing** (una sola página con scroll suave) y **multipágina**, según lo que elija la psicóloga.
- SEO por página con `generateMetadata`, JSON-LD y sin contenido oculto engañoso.
- Si un tema ofrece reservas, usa el mismo formulario y la misma Server Action para todos los temas (ver skill `psicocms-citas`). El tema no implementa lógica de reservas propia.
- HTML que venga del editor (por ejemplo artículos) se sanea con DOMPurify (ver skill `psicocms-seguridad`).

## Textos
Según la skill `psicocms-textos`: español correcto, con tildes, y sin nombres propios fijos.

## Comprobación antes de dar el tema por terminado
- [ ] Cambia el tema activo desde el panel y no falta ningún componente ni dato.
- [ ] Sin colores fijos en componentes (búsqueda de `#` y `rgb(` en el tema).
- [ ] Un solo `h1` por página. Lighthouse o revisión manual de accesibilidad y rendimiento.
- [ ] Probado en los dos modos (landing y multipágina) y en móvil.
- [ ] `npm run build` sin errores y `MAP.md` actualizado.
