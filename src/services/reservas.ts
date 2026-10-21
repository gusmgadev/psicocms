// src/services/reservas.ts
// Reserva pública de citas: consulta de huecos y creación vía RPC.
// El navegador nunca toca Supabase: todo pasa por Server Actions con service_role.

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { instanteDesdeLocal, hoyEnZona, sumarDias } from "@/lib/fechas";
import { obtenerTimezone, type Modalidad } from "@/services/disponibilidad";
import { obtenerConfigEmail, enviarEmail } from "@/services/email";

export type { Modalidad };

export interface HuecoPublico {
  slot_date: string;
  slot_start: string;
  slot_end: string;
}

export interface ReservaInput {
  nombre: string;
  telefono: string;
  email?: string;
  motivo?: string;
  modality: Modalidad;
  fecha: string; // YYYY-MM-DD (local de la psicóloga)
  hora: string; // HH:MM (local de la psicóloga)
  consentVersion: string;
  honeypot?: string;
}

export interface ReservaExito {
  ok: true;
  citaId: string;
  fecha: string;
  hora: string;
  modality: Modalidad;
  timezone: string;
  nombre: string;
  inicioIso: string;
  finIso: string;
  ubicacion: string | null;
}

export interface ReservaError {
  ok: false;
  error: string;
}

export type ResultadoReserva = ReservaExito | ReservaError;

const LIMITE_NOMBRE = { min: 2, max: 100 };
const LIMITE_MOTIVO = 500;
const LIMITE_TELEFONO = /^[0-9]{6,15}$/;
const LIMITE_EMAIL = 200;
const DIAS_HUECOS = 60;

interface FilaSlot {
  slot_date: string;
  slot_start: string;
  slot_end: string;
  available: boolean;
}

interface FilaBooking {
  appointment_id: string;
  patient_id: string;
  patient_number: string;
  message: string;
}

interface FilaDuracion {
  session_duration_online: number;
  session_duration_inperson: number;
}

function normalizarTelefono(valor: string): string {
  return (valor ?? "").replace(/[^0-9]/g, "");
}

function esEmail(valor: string | undefined): boolean {
  if (!valor?.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

// ============================================================
// Huecos disponibles (RPC get_available_slots vía service_role)
// ============================================================

export async function obtenerHuecosPublicos(modality: Modalidad): Promise<HuecoPublico[]> {
  if (modality !== "online" && modality !== "inperson") return [];

  const timezone = await obtenerTimezone();
  const desde = hoyEnZona(timezone);
  const hasta = sumarDias(desde, DIAS_HUECOS);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_available_slots", {
    p_modality: modality,
    p_date_from: desde,
    p_date_to: hasta,
  });

  if (error || !data) return [];

  const filas = (data ?? []) as unknown as FilaSlot[];
  return filas
    .filter((f) => f.available)
    .map((f) => ({
      slot_date: f.slot_date,
      slot_start: f.slot_start,
      slot_end: f.slot_end,
    }));
}

// ============================================================
// Duración de sesión por modalidad (para calcular fin)
// ============================================================

async function obtenerDuracionSesion(modality: Modalidad): Promise<number | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("professional_profile")
    .select("session_duration_online, session_duration_inperson")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const fila = data as unknown as FilaDuracion;
  return modality === "online" ? fila.session_duration_online : fila.session_duration_inperson;
}

// ============================================================
// Crear reserva (RPC create_public_booking vía service_role)
// ============================================================

export async function crearReservaPublica(input: ReservaInput): Promise<ResultadoReserva> {
  const nombre = (input.nombre ?? "").trim();
  if (nombre.length < LIMITE_NOMBRE.min || nombre.length > LIMITE_NOMBRE.max) {
    return { ok: false, error: "El nombre debe tener entre 2 y 100 caracteres." };
  }

  const telefono = normalizarTelefono(input.telefono);
  if (!LIMITE_TELEFONO.test(telefono)) {
    return { ok: false, error: "El teléfono solo puede contener números (entre 6 y 15 dígitos)." };
  }

  const email = input.email?.trim() ?? "";
  if (email.length > LIMITE_EMAIL || !esEmail(email)) {
    return { ok: false, error: "El email no tiene un formato válido." };
  }

  const motivo = (input.motivo ?? "").trim();
  if (motivo.length > LIMITE_MOTIVO) {
    return { ok: false, error: `El motivo no puede superar ${LIMITE_MOTIVO} caracteres.` };
  }

  if (input.modality !== "online" && input.modality !== "inperson") {
    return { ok: false, error: "Modalidad no válida." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha) || !/^\d{2}:\d{2}$/.test(input.hora)) {
    return { ok: false, error: "Fecha u hora no válidas." };
  }

  const consentVersion = (input.consentVersion ?? "").trim();
  if (!consentVersion) {
    return { ok: false, error: "Debes aceptar la política de privacidad." };
  }

  const timezone = await obtenerTimezone();
  const duracion = await obtenerDuracionSesion(input.modality);
  if (!duracion || duracion < 5) {
    return { ok: false, error: "No hay disponibilidad configurada en este momento." };
  }

  const inicio = instanteDesdeLocal(input.fecha, input.hora, timezone);
  const fin = new Date(inicio.getTime() + duracion * 60_000);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_public_booking", {
    p_patient_name: nombre,
    p_patient_phone: telefono,
    p_patient_email: email,
    p_reason: motivo || null,
    p_modality: input.modality,
    p_starts_at: inicio.toISOString(),
    p_ends_at: fin.toISOString(),
    p_consent_version: consentVersion,
    p_honeypot: input.honeypot ?? "",
  });

  if (error || !data || (data as unknown as FilaBooking[]).length === 0) {
    return {
      ok: false,
      error:
        traducirErrorReserva(error?.message) ||
        "No se pudo completar la reserva. Elige otro horario e inténtalo de nuevo.",
    };
  }

  const fila = (data as unknown as FilaBooking[])[0];

  // Si se reutilizó una ficha existente, actualizar el consentimiento con la versión actual
  await admin
    .from("patients")
    .update({ consent_at: new Date().toISOString(), consent_version: consentVersion })
    .eq("id", fila.patient_id)
    .select("id")
    .maybeSingle();

  const ubicacion = await obtenerUbicacionConsulta();

  // Email de aviso: sin motivo ni datos de salud. Nunca rompe la reserva.
  void enviarAvisoReserva({
    nombre,
    fecha: input.fecha,
    hora: input.hora,
    modality: input.modality,
    timezone,
  });

  return {
    ok: true,
    citaId: fila.appointment_id,
    fecha: input.fecha,
    hora: input.hora,
    modality: input.modality,
    timezone,
    nombre,
    inicioIso: inicio.toISOString(),
    finIso: fin.toISOString(),
    ubicacion,
  };
}

function traducirErrorReserva(mensaje: string | undefined): string | null {
  if (!mensaje) return null;
  const m = mensaje.toLowerCase();
  if (m.includes("hueco") && m.includes("disponible")) {
    return "Ese horario ya no está disponible. Elige otro.";
  }
  if (m.includes("límite") || m.includes("limite")) {
    return "Has alcanzado el máximo de citas que puedes reservar. Contacta por teléfono si necesitas más.";
  }
  if (m.includes("vacacion")) {
    return "No hay disponibilidad en este periodo. Elige otras fechas.";
  }
  if (m.includes("pasado")) {
    return "No se pueden reservar citas en el pasado.";
  }
  if (m.includes("inválid") || m.includes("invalid")) {
    return "Los datos de la reserva no son válidos.";
  }
  // Mensaje genérico: no exponer detalles internos
  return null;
}

async function obtenerUbicacionConsulta(): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("professional_profile")
    .select("address, location_name")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const fila = data as { address: string | null; location_name: string | null };
  return [fila.address, fila.location_name].filter(Boolean).join(", ") || null;
}

interface AvisoReserva {
  nombre: string;
  fecha: string;
  hora: string;
  modality: Modalidad;
  timezone: string;
}

async function enviarAvisoReserva(aviso: AvisoReserva): Promise<void> {
  try {
    const config = await obtenerConfigEmail();
    if (!config.notificationsEnabled || !config.notifyOnBooking) return;
    if (!config.fromEmail) return;

    const etiquetaModalidad = aviso.modality === "online" ? "Online" : "Presencial";
    const [fechaLarga] = [
      new Intl.DateTimeFormat("es-ES", {
        timeZone: aviso.timezone,
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(`${aviso.fecha}T${aviso.hora}:00`)),
    ];

    const asunto = "Nueva cita reservada";
    const html = [
      `<p>Hola,</p>`,
      `<p>Tienes una <strong>nueva cita</strong> reservada desde la web:</p>`,
      `<ul>`,
      `<li><strong>Nombre:</strong> ${escaparHtml(aviso.nombre)}</li>`,
      `<li><strong>Fecha:</strong> ${fechaLarga}</li>`,
      `<li><strong>Hora:</strong> ${aviso.hora}</li>`,
      `<li><strong>Modalidad:</strong> ${etiquetaModalidad}</li>`,
      `</ul>`,
      `<p>Consulta el detalle en el panel de PsicoCMS.</p>`,
    ].join("");
    const textoPlano = [
      "Nueva cita reservada desde la web:",
      `Nombre: ${aviso.nombre}`,
      `Fecha: ${fechaLarga}`,
      `Hora: ${aviso.hora}`,
      `Modalidad: ${etiquetaModalidad}`,
      "Consulta el detalle en el panel de PsicoCMS.",
    ].join("\n");

    await enviarEmail(config.fromEmail, asunto, html, textoPlano);
  } catch {
    // El email nunca debe hacer fallar la reserva.
  }
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
