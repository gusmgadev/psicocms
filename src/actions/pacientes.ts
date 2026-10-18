// src/actions/pacientes.ts
// Server Actions de pacientes (todas verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  listarPacientes,
  obtenerPaciente,
  listarCitasDelPaciente,
  crearPaciente,
  editarPaciente,
  exportarPaciente,
  anonimizarPaciente,
  eliminarPaciente,
  type FiltroPacientes,
  type InputPaciente,
  type ResultadoPaciente,
  type ResultadoPacientes,
  type ExportacionPaciente,
  type PacienteFila,
  type CitaResumenPaciente,
} from "@/services/pacientes";

export async function listarPacientesAction(filtro: FiltroPacientes): Promise<ResultadoPacientes> {
  await exigirSesion();
  return listarPacientes(filtro);
}

export async function obtenerPacienteAction(id: string): Promise<PacienteFila | null> {
  await exigirSesion();
  return obtenerPaciente(id);
}

export async function listarCitasDelPacienteAction(id: string): Promise<CitaResumenPaciente[]> {
  await exigirSesion();
  return listarCitasDelPaciente(id);
}

export async function crearPacienteAction(input: InputPaciente): Promise<ResultadoPaciente> {
  await exigirSesion();
  if (!input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return crearPaciente(input);
}

export async function editarPacienteAction(id: string, input: InputPaciente): Promise<ResultadoPaciente> {
  await exigirSesion();
  if (!id || !input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return editarPaciente(id, input);
}

export async function exportarPacienteAction(id: string): Promise<ExportacionPaciente | null> {
  await exigirSesion();
  return exportarPaciente(id);
}

export async function anonimizarPacienteAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return anonimizarPaciente(id);
}

export async function eliminarPacienteAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return eliminarPaciente(id);
}
