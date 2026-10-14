---
description: Crea un tema visual nuevo a partir del tema base (uso: /tema <nombre>)
---
Lee @AGENTS.md, @MAP.md y la skill psicocms-temas.
Crea el tema visual "$ARGUMENTS" a partir del tema base:
1. Copia el tema base a src/themes/ con ese nombre.
2. Cambia primero solo los tokens (colores y tipografía) y enséñame el resultado antes de seguir con el diseño.
3. Después adapta layout y componentes específicos del tema, sin colores fijos en componentes.
4. Regístralo en el índice de temas y en los datos iniciales (migración nueva si hace falta).
Reglas: un único h1 por página, CSS Modules sin Tailwind, rem con base de 10px, fuentes WOFF2 e imágenes WebP, datos siempre desde la base de datos, soporte de landing y multipágina, y textos según la skill psicocms-textos.
No instales librerías sin mi autorización. Actualiza @MAP.md y avísame cuando esté listo para validar.
