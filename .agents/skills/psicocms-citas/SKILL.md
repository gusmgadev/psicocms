---
name: psicocms-citas
description: Lógica de disponibilidad, citas y reservas de PsicoCMS (online y presencial, duración y descanso por modalidad, semana de 7 días con horas marcables, modo y periodos de vacaciones, solapamientos, reserva pública y pacientes duplicados). Úsala siempre que se trabaje en las FASES 4, 5, 7 o 17, en las tablas availability_slots, vacation_periods, appointments o patients, en las funciones get_available_slots o create_public_booking, en el calendario o en el formulario de reserva, aunque el usuario solo hable de horarios, agenda o turnos.
---

# PsicoCMS: citas y disponibilidad

`AGENTS.md` (FASES 4, 5, 7 y 17) manda. Los diseños de `dashboard-design` son solo inspiración: no mandan sobre la lógica.

## Modelo mental
- Dos modalidades, **online** y **presencial**, cada una con su duración de sesión y su descanso entre sesiones.
- Disponibilidad semanal por modalidad: día de la semana + hora de inicio (`availability_slots`). La psicóloga marca las horas con clic en una semana de 7 días.
- Vacaciones: un interruptor general (modo vacaciones) y periodos concretos (`vacation_periods`). El modo vacaciones pausa las reservas nuevas pero **no cancela** las citas ya existentes.
- Una cita (`appointments`) enlaza con un paciente, tiene modalidad, inicio, fin, estado, motivo y origen (web o manual).

## Reglas que no se rompen
1. **Un solo hueco, una sola cita.** La base de datos debe impedir que dos citas activas se solapen (restricción de exclusión sobre un rango de tiempo con `btree_gist`). El frontend solo avisa; la garantía es la base de datos.
2. **El hueco libre se calcula en servidor** con `get_available_slots(modality, date_from, date_to)`: excluye citas activas, aplica descansos, periodos de vacaciones y modo vacaciones. No devuelve datos de pacientes.
3. **Revalidar al reservar.** `create_public_booking` vuelve a comprobar disponibilidad, que la fecha no sea pasada y que encaje en un hueco válido. Dos personas pueden elegir el mismo hueco a la vez: la segunda debe recibir un mensaje claro ("ese horario ya no está disponible") y nuevas opciones.
4. **Cambiar duración o descanso** de una modalidad avisa a la psicóloga de que debe reconfigurar los huecos, y no rompe las citas existentes.
5. **Pacientes:** el id es un UUID interno. El teléfono es dato de contacto, se guarda limpio (solo números) y NO es único. Si coinciden teléfono y nombre (sin distinguir mayúsculas ni acentos) se reutiliza la ficha; si el teléfono existe con otro nombre se crea ficha nueva marcada como `possible_duplicate`.
6. **Respuesta pública genérica:** nunca dice si el teléfono ya existía ni devuelve datos del paciente.
7. **Acceso:** `create_public_booking` solo la ejecuta `service_role` y solo desde la Server Action de reserva (ver skill `psicocms-seguridad`).
8. **Fechas y horas:** sigue la skill `local-dates` para zonas horarias y cambios de hora.

## Casos límite que debes probar o dejar listos para probar
- Última franja del día y primera de la mañana.
- Cita justo antes y justo después de un periodo de vacaciones.
- Cambio de hora (verano/invierno) en un día con citas.
- Dos reservas simultáneas del mismo hueco.
- Mover una cita desde el calendario a un hueco ocupado.
- Cita con descanso: el siguiente hueco empieza después del descanso, no pegado.
- Editar una cita en el panel sin romper la regla de solapamiento.
- Reserva con el mismo teléfono y distinto nombre.

## Al implementar
- Cambios de esquema: migración nueva, RLS y permisos de funciones (skill `psicocms-seguridad`).
- No añadas librerías de calendario o fechas sin autorización. Comprueba que la librería de calendario aprobada funciona con React/Next (solo cliente).
- Textos de interfaz según la skill `psicocms-textos`.
