// src/actions/reservas.ts
// Server Actions de reserva pública (sin sesión).
// Llaman a service_role vía el servicio; aplican honeypot y rate limits.

"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/services/rate-limit";
import { obtenerPoliticaPrivacidad } from "@/services/politica-privacidad";
import {
  crearReservaPublica,
  obtenerHuecosPublicos,
  type Modalidad,
  type ReservaInput,
} from "@/services/reservas";

const LIMITE_IP = { max: 5, ventanaMs: 60 * 60 * 1000 }; // 5/hora
const LIMITE_TELEFONO = { max: 3, ventanaMs: 60 * 60 * 1000 }; // 3/hora

export interface HuecosSemana {
  ok: boolean;
  error?: string;
  slots: { fecha: string; hora: string }[];
}

export async function obtenerHuecosAction(modality: string): Promise<HuecosSemana> {
  if (modality !== "online" && modality !== "inperson") {
    return { ok: false, error: "Modalidad no válida.", slots: [] };
  }

  try {
    const huecos = await obtenerHuecosPublicos(modality as Modalidad);
    return {
      ok: true,
      slots: huecos.map((h) => ({ fecha: h.slot_date, hora: h.slot_start.slice(0, 5) })),
    };
  } catch {
    return {
      ok: false,
      error: "No se pudo cargar la disponibilidad. Inténtalo de nuevo.",
      slots: [],
    };
  }
}

export async function obtenerVersionPoliticaAction(): Promise<string> {
  try {
    const politica = await obtenerPoliticaPrivacidad();
    return politica.version || "1.0";
  } catch {
    return "1.0";
  }
}

export interface ResultadoReservaAction {
  ok: boolean;
  error?: string;
  cita?: {
    id: string;
    fecha: string;
    hora: string;
    modality: Modalidad;
    timezone: string;
    nombre: string;
    inicioIso: string;
    finIso: string;
    ubicacion: string | null;
  };
}

export async function crearReservaAction(
  formData: FormData
): Promise<ResultadoReservaAction> {
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot) {
    return { ok: false, error: "No se pudo completar la reserva." };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefonoCrudo = String(formData.get("telefono") ?? "").trim();
  const telefonoLimpio = telefonoCrudo.replace(/[^0-9]/g, "");
  const email = String(formData.get("email") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();
  const modality = String(formData.get("modality") ?? "");
  const fecha = String(formData.get("fecha") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();
  const consent = formData.get("consent");
  const consentVersion = String(formData.get("consentVersion") ?? "").trim();

  if (!nombre || !telefonoLimpio || !fecha || !hora) {
    return { ok: false, error: "Completa los campos obligatorios." };
  }
  if (modality !== "online" && modality !== "inperson") {
    return { ok: false, error: "Elige si la cita es online o presencial." };
  }
  if (consent !== "on" && consent !== "true" && consent !== "1") {
    return { ok: false, error: "Debes aceptar la política de privacidad." };
  }

  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    const limiteIp = await checkRateLimit(
      `reserva:ip:${ip}`,
      "booking",
      LIMITE_IP.max,
      LIMITE_IP.ventanaMs
    );
    if (!limiteIp.allowed) {
      return {
        ok: false,
        error: "Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.",
      };
    }

    const limiteTel = await checkRateLimit(
      `reserva:tel:${telefonoLimpio}`,
      "booking",
      LIMITE_TELEFONO.max,
      LIMITE_TELEFONO.ventanaMs
    );
    if (!limiteTel.allowed) {
      return {
        ok: false,
        error: "Has alcanzado el máximo de reservas por teléfono. Contacta directamente.",
      };
    }

    const input: ReservaInput = {
      nombre,
      telefono: telefonoLimpio,
      email: email || undefined,
      motivo: motivo || undefined,
      modality: modality as Modalidad,
      fecha,
      hora,
      consentVersion,
      honeypot: "",
    };

    const resultado = await crearReservaPublica(input);

    if (!resultado.ok) {
      return { ok: false, error: resultado.error };
    }

    return {
      ok: true,
      cita: {
        id: resultado.citaId,
        fecha: resultado.fecha,
        hora: resultado.hora,
        modality: resultado.modality,
        timezone: resultado.timezone,
        nombre: resultado.nombre,
        inicioIso: resultado.inicioIso,
        finIso: resultado.finIso,
        ubicacion: resultado.ubicacion,
      },
    };
  } catch {
    return {
      ok: false,
      error: "Ha ocurrido un error. Inténtalo de nuevo más tarde.",
    };
  }
}
