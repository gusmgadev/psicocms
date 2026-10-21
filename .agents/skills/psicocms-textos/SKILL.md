---
name: psicocms-textos
description: Textos, idioma, tono, nombres y formatos de interfaz de PsicoCMS (todo en español con tildes, producto PsicoCMS, tuteo en el panel, traducciones del diseño en inglés, mensajes de error, estados vacíos, formatos de fecha y hora, términos configurables como paciente y psicóloga). Úsala siempre que se escriba o modifique texto visible: botones, menús, títulos, formularios, mensajes, emails, placeholders o contenido de ejemplo, en el panel o en la web pública, aunque el usuario no hable de textos.
---

# PsicoCMS: textos de interfaz

## Reglas generales
- Todo el texto visible está en **español**, con tildes y eñes correctas. `AGENTS.md` contiene algunas palabras sin tilde (por ejemplo "psicologa"); esa es una licencia de ese documento y **no** se copia a la interfaz: en pantalla es "psicóloga", "configuración", "información".
- El producto se llama **PsicoCMS**. En las imágenes de `dashboard-design` aparece "Sanctuary CMS": no se usa.
- **Tuteo** en el panel (cercano y directo): "Aquí tienes un resumen de tu actividad". En la web pública el tono lo define el tema, siempre profesional, cálido y claro; la psicóloga puede editarlo.
- Frases cortas. Evita la jerga clínica innecesaria en la web pública.
- Nunca pongas nombres propios fijos ("Dra. Elena", "María García"): salen del perfil o son datos de prueba claramente marcados.

## Traducciones del diseño del panel
| En el diseño | En PsicoCMS |
|---|---|
| New Session | Nueva cita |
| Patients | Pacientes |
| Calendar | Calendario |
| Availability | Disponibilidad |
| Blog | Blog |
| Help Center | Centro de ayuda |
| Logout | Cerrar sesión |
| Dashboard / Home | Inicio |
| Settings | Configuración |
| Web management | Gestión web |

## Términos configurables
"Paciente" y "psicóloga" deben poder cambiarse sin tocar código (por ejemplo vía textos configurables), para poder generalizar el sistema a otras profesiones en el futuro. No los repitas como cadenas sueltas por todo el código: centralízalos.

## Vocabulario clínico
- **Cita:** lo agendado (calendario, listado de citas, reservas).
- **Nota de sesión:** lo que la psicóloga escribe en la historia después de una sesión.
- Evita la palabra "sesión" suelta cuando pueda confundirse: puede significar la duración del hueco, la sesión de terapia o la sesión iniciada (login). Usa "duración de la cita", "nota de sesión" y "sesión iniciada" respectivamente.

## Formatos
- Fecha **dd/mm/aaaa**, hora en **24 horas**, semana que empieza en lunes. Ver skill `local-dates`.
- Teléfonos: se guardan solo con números; al mostrarlos se pueden agrupar para leerse mejor.
- Moneda y números con formato español (coma decimal), según la configuración regional.

## Tipos de mensaje
- **Errores de autenticación:** siempre genéricos ("Los datos no son correctos"). No indican qué dato falló ni si la cuenta existe.
- **Errores de validación:** dicen qué corregir y cómo ("El teléfono solo puede tener números").
- **Errores inesperados:** amables, sin detalles técnicos ni datos de pacientes ("Algo salió mal. Inténtalo de nuevo en unos minutos").
- **Estados vacíos:** dicen qué falta y ofrecen la acción ("Todavía no tienes pacientes. Crea el primero").
- **Confirmaciones destructivas** (eliminar, anonimizar): explican qué pasa y cuesta un paso más confirmar. No uses `alert`, `confirm` ni `prompt` del navegador: usa modales propios.
- **Éxito:** breve y sin exceso ("Cita guardada").

## Reserva pública
- Botones claros: "Reservar cita", "Online" y "Presencial".
- La casilla de privacidad lleva enlace a la política y es obligatoria.
- La confirmación no repite el motivo de la consulta ni datos de salud.
- El email a la psicóloga solo incluye nombre, fecha, hora y modalidad (ver skill `psicocms-seguridad`).

## Revisión final
- [ ] Sin textos en inglés visibles.
- [ ] Sin tildes faltantes ni nombres propios fijos.
- [ ] Mensajes de error genéricos donde corresponda.
- [ ] Términos centralizados y configurables.
