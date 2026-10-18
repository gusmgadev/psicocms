// src/actions/disponibilidad.ts
// Server Actions de disponibilidad (todas verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  guardarConfigSesiones,
  guardarHuecos,
  setModoVacaciones,
  crearPeriodoVacaciones,
  borrarPeriodoVacaciones,
  type ConfigSesiones,
  type MarcaHueco,
  type Modalidad,
  type PeriodoVacaciones,
} from "@/services/disponibilidad";

interface Resultado {
  ok: boolean;
  error?: string;
}

export async function guardarConfigAction(
  input: ConfigSesiones,
): Promise<{ ok: boolean; error?: string; avisos?: string[] }> {
  await exigirSesion();
  return guardarConfigSesiones(input);
}

export async function guardarHuecosAction(modality: Modalidad, marcas: MarcaHueco[]): Promise<Resultado> {
  await exigirSesion();
  if (!Array.isArray(marcas) || marcas.length > 200) {
    return { ok: false, error: "Datos de horario no válidos." };
  }
  return guardarHuecos(modality, marcas);
}

export async function setModoVacacionesAction(activo: boolean): Promise<Resultado> {
  await exigirSesion();
  if (typeof activo !== "boolean") return { ok: false, error: "Valor no válido." };
  return setModoVacaciones(activo);
}

export async function crearPeriodoAction(input: {
  startDate: string;
  endDate: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string; periodo?: PeriodoVacaciones }> {
  await exigirSesion();
  if (!input || typeof input.startDate !== "string" || typeof input.endDate !== "string") {
    return { ok: false, error: "Datos no válidos." };
  }
  return crearPeriodoVacaciones(input);
}

export async function borrarPeriodoAction(id: string): Promise<Resultado> {
  await exigirSesion();
  return borrarPeriodoVacaciones(id);
}
