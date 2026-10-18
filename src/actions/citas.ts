// src/actions/citas.ts
// Server Actions de citas (todas verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  listarCitas,
  listarPacientesParaCita,
  crearCita,
  editarCita,
  eliminarCita,
  type FiltroCitas,
  type InputCita,
  type PacienteSelector,
  type ResultadoCitas,
  type ResultadoCita,
} from "@/services/citas";

export async function listarCitasAction(filtro: FiltroCitas): Promise<ResultadoCitas> {
  await exigirSesion();
  return listarCitas(filtro);
}

export async function listarPacientesAction(): Promise<PacienteSelector[]> {
  await exigirSesion();
  return listarPacientesParaCita();
}

export async function crearCitaAction(input: InputCita): Promise<ResultadoCita> {
  await exigirSesion();
  if (!input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return crearCita(input);
}

export async function editarCitaAction(id: string, input: InputCita): Promise<ResultadoCita> {
  await exigirSesion();
  if (!id || !input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return editarCita(id, input);
}

export async function eliminarCitaAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return eliminarCita(id);
}
