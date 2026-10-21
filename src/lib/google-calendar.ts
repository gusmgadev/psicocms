// src/lib/google-calendar.ts
// Enlace a Google Calendar sin APIs (skill local-dates).
// Las fechas van en UTC con formato AAAAMMDDTHHMMSSZ.
// No se incluye el motivo de la consulta ni datos de salud.

export function enlaceGoogleCalendar(opciones: {
  titulo: string;
  inicioIso: string;
  finIso: string;
  detalles?: string;
  ubicacion?: string;
}): string {
  const aUtc = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opciones.titulo,
    dates: `${aUtc(opciones.inicioIso)}/${aUtc(opciones.finIso)}`,
  });
  if (opciones.detalles) params.set("details", opciones.detalles);
  if (opciones.ubicacion) params.set("location", opciones.ubicacion);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
