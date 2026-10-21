// src/actions/historias.ts
// Server Actions de historias clínicas (todas verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  listarPacientesHistorial,
  listarHistoriaPaciente,
  listarCitasParaNota,
  crearSesionHistoria,
  editarSesionHistoria,
  borrarSesionHistoria,
  subirArchivoHistoria,
  borrarArchivoHistoria,
  urlFirmadaArchivo,
  type ResultadoHistoriales,
  type HistoriaPaciente,
  type CitaParaNota,
  type ResultadoSesion,
  type ResultadoArchivo,
} from "@/services/historias";

export async function listarPacientesHistorialAction(busqueda?: string): Promise<ResultadoHistoriales> {
  await exigirSesion();
  return listarPacientesHistorial(busqueda);
}

export async function listarHistoriaPacienteAction(patientId: string): Promise<HistoriaPaciente | null> {
  await exigirSesion();
  if (!patientId) return null;
  return listarHistoriaPaciente(patientId);
}

export async function listarCitasParaNotaAction(patientId: string): Promise<CitaParaNota[]> {
  await exigirSesion();
  if (!patientId) return [];
  return listarCitasParaNota(patientId);
}

export async function crearSesionHistoriaAction(
  patientId: string,
  fecha: string,
  contentHtml: string,
  appointmentId?: string | null,
): Promise<ResultadoSesion> {
  await exigirSesion();
  if (!patientId || typeof contentHtml !== "string") return { ok: false, error: "Datos no válidos." };
  return crearSesionHistoria(patientId, fecha, contentHtml, appointmentId);
}

export async function editarSesionHistoriaAction(
  recordId: string,
  fecha: string,
  contentHtml: string,
  appointmentId?: string | null,
): Promise<ResultadoSesion> {
  await exigirSesion();
  if (!recordId || typeof contentHtml !== "string") return { ok: false, error: "Datos no válidos." };
  return editarSesionHistoria(recordId, fecha, contentHtml, appointmentId);
}

export async function borrarSesionHistoriaAction(recordId: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!recordId) return { ok: false, error: "Sesión no válida." };
  return borrarSesionHistoria(recordId);
}

export async function subirArchivoHistoriaAction(
  recordId: string,
  formData: FormData,
): Promise<ResultadoArchivo> {
  await exigirSesion();
  if (!recordId) return { ok: false, error: "Sesión no válida." };
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) return { ok: false, error: "No se ha seleccionado ningún archivo." };
  return subirArchivoHistoria(recordId, archivo);
}

export async function borrarArchivoHistoriaAction(fileId: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!fileId) return { ok: false, error: "Archivo no válido." };
  return borrarArchivoHistoria(fileId);
}

export async function urlFirmadaArchivoAction(
  fileId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  await exigirSesion();
  if (!fileId) return { ok: false, error: "Archivo no válido." };
  return urlFirmadaArchivo(fileId);
}
