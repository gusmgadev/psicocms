# Prompt 00c: Preparar los recursos visuales (FASE 0C)

Antes de lanzarlo: tener terminada la FASE 0A y las carpetas "tema-visual-base" y "dashboard-design" en la raíz del proyecto.

Lee @AGENTS.md, @plan-implementacion.md y @MAP.md.
Ejecuta únicamente la FASE 0C: preparación de los recursos visuales.

Reglas:
- No cambies la apariencia visual del tema base: el resultado debe verse idéntico.
- Consolida las variables de color en variables con significado y deja documentada en @MAP.md la equivalencia entre las antiguas y las nuevas.
- Un único h1 por página. Corrige los errores de texto.
- Font Awesome: deja solo all.min.css y webfonts en WOFF2. Fuentes propias: WOFF2, solo los pesos usados, con next/font/local.
- Optimiza las imágenes y lista en @MAP.md todas las imágenes de stock, porque tengo que verificar que puedo redistribuirlas.
- Las imágenes de dashboard-design son de referencia: no las modifiques ni las copies a public/. Extrae de ellas los tokens del panel (colores, tipografía, radios, sombras, espaciados) a variables CSS y anótalos en @MAP.md.
- Aplica las reglas de la sección "Reglas sobre los recursos de diseño del panel" de @AGENTS.md.
- No instales librerías nuevas sin mi autorización. Si necesitas una herramienta puntual para convertir fuentes o imágenes, dime cuál y por qué antes de usarla.
- Al terminar: verifica que npm run build compila, actualiza @MAP.md, marca la fase en @plan-implementacion.md y avísame para validar visualmente.
