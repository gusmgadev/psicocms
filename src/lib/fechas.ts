// src/lib/fechas.ts
// Utilidades compartidas de fechas y horas (servidor y navegador).
// Reglas: skill local-dates (zona IANA, dd/mm/aaaa, 24 h, semana desde lunes).

export const DIAS_SEMANA = [
  { valor: 1, corto: "Lun", largo: "Lunes" },
  { valor: 2, corto: "Mar", largo: "Martes" },
  { valor: 3, corto: "Mié", largo: "Miércoles" },
  { valor: 4, corto: "Jue", largo: "Jueves" },
  { valor: 5, corto: "Vie", largo: "Viernes" },
  { valor: 6, corto: "Sáb", largo: "Sábado" },
  { valor: 0, corto: "Dom", largo: "Domingo" },
] as const;

export function formatearFecha(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatearHora(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatearFechaHora(iso: string, timeZone: string): string {
  return `${formatearFecha(iso, timeZone)} ${formatearHora(iso, timeZone)}`;
}

export function hoyEnZona(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function lunesDeLaSemana(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Convierte "fecha + hora locales de la psicóloga" a instante (UTC).
// Método de dos pasadas con Intl: funciona en servidor y navegador sin librerías.
export function instanteDesdeLocal(fecha: string, hora: string, timeZone: string): Date {
  const candidato = new Date(`${fecha}T${hora.length === 5 ? `${hora}:00` : hora}Z`);
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(candidato);

  const ob: Record<string, string> = {};
  for (const p of partes) ob[p.type] = p.value;

  const paredEnZona = Date.UTC(
    Number(ob.year),
    Number(ob.month) - 1,
    Number(ob.day),
    Number(ob.hour) % 24,
    Number(ob.minute),
    Number(ob.second),
  );
  const desfase = paredEnZona - candidato.getTime();
  return new Date(candidato.getTime() - desfase);
}

// Instante → "fecha" y "hora" locales para rellenar inputs del panel.
export function partesParaInputs(iso: string, timeZone: string): { fecha: string; hora: string } {
  const fecha = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  const hora = formatearHora(iso, timeZone);
  return { fecha, hora };
}

// Cadena "YYYY-MM-DD" (sin hora, sin zona) → "dd/mm/aaaa"
export function formatearFechaCadena(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}/${fecha.slice(0, 4)}`;
}

export function minutosATexto(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function textoAMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// "fecha" y "hora" locales (de la psicóloga) → Date con esos dígitos en el
// reloj local del navegador. Solo para alimentar calendarios visuales
// (Calendar.js muestra estos dígitos tal cual); nunca como instante real.
export function fechaLocalDePartes(fecha: string, hora: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

// Date con dígitos de reloj local → "fecha" (YYYY-MM-DD) y "hora" (HH:MM).
export function partesDeFechaLocal(date: Date): { fecha: string; hora: string } {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return {
    fecha: `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`,
    hora: `${p2(date.getHours())}:${p2(date.getMinutes())}`,
  };
}
