---
name: local-dates
description: Manejo correcto de fechas, horas y zonas horarias en PsicoCMS (timestamptz, zona horaria de la psicóloga, cambios de hora, formato dd/mm/aaaa y 24 horas, semana que empieza en lunes, enlace a Google Calendar). Úsala siempre que el código cree, guarde, compare, calcule o muestre fechas u horas, citas, huecos, vacaciones, calendarios o recordatorios, aunque el usuario no mencione zonas horarias.
---

# Fechas y horas en PsicoCMS

Los errores de fecha en una agenda son invisibles hasta que una cita cae a la hora equivocada. Sigue estas reglas sin excepciones.

## Almacenamiento
- Los instantes (inicio y fin de una cita) se guardan como **`timestamptz`** en Postgres (se almacenan en UTC).
- La **zona horaria de la psicóloga** es un nombre IANA (por ejemplo `Europe/Madrid`). Se guarda en `site_settings`. Si no existe esa columna, propón añadirla en una migración nueva y pregunta antes de decidir el valor por defecto.
- La **disponibilidad semanal es hora local**, no UTC: se guarda como día de la semana + hora local (por ejemplo "lunes 09:00"). Si se guardara en UTC, cada cambio de hora desplazaría el horario.
- Al generar huecos concretos de una fecha, convierte "fecha local + hora local + zona de la psicóloga" a instante UTC en un solo sitio (una función de utilidad), y reutilízala en todo el proyecto.

## Cálculo
- Compara y resta instantes, nunca cadenas de texto de fecha.
- **Cambio de hora:** hay horas que no existen (salto adelante) y horas que se repiten (salto atrás). Un hueco que cae en una hora inexistente no se ofrece; uno ambiguo se resuelve de forma explícita y documentada. Prueba siempre un día de cambio de hora.
- La duración y el descanso se suman sobre el instante, no sobre el reloj local.
- No uses `new Date('2026-10-14')` para fechas sin hora: se interpreta como UTC y puede mostrar el día anterior. Y no uses `toISOString().slice(0,10)` para obtener "el día de hoy" local.
- El servidor es la autoridad sobre qué es "hoy" y "pasado" (con la zona de la psicóloga), no el reloj del visitante.

## Visualización
- Formato de fecha **dd/mm/aaaa** y hora en **24 horas**, en español. Usa `Intl.DateTimeFormat('es', { timeZone })` con la zona de la psicóloga; no formatees a mano.
- La semana empieza en **lunes** (Lun, Mar, Mié, Jue, Vie, Sáb, Dom).
- Si el visitante está en otra zona horaria, la web pública muestra las horas en la zona de la psicóloga e indica cuál es.
- Si cambias a otro formato de hora (por ejemplo AM/PM como en la imagen de diseño), anótalo en `MAP.md`.

## Enlace a Google Calendar (sin APIs)
- Se construye con la url de plantilla de Google Calendar. El parámetro de fechas va en **UTC**, con formato `AAAAMMDDTHHMMSSZ/AAAAMMDDTHHMMSSZ`. Codifica correctamente título y detalles.
- No incluyas el motivo de la consulta ni datos de salud en el título ni en los detalles.

## Dependencias
- No instales `date-fns`, `luxon`, `dayjs` ni similares sin autorización. `Intl` y las utilidades propias bastan. Si de verdad hace falta una, propónlo con el motivo.

## Pruebas mínimas
- Cita a las 00:30 y a las 23:30 locales.
- Día de cambio de hora (primavera y otoño).
- Cita que cruza la medianoche local.
- Mostrar la misma cita desde un navegador en otra zona horaria.
