// src/services/historias.ts
// Historias clínicas: una fila por sesión (clinical_records) con sus archivos
// adjuntos (clinical_files). Los archivos viven en el bucket privado
// "clinical-files" bajo la ruta uid/pacienteId/uuid.ext (la política de
// escritura exige que el primer segmento sea el id de la psicóloga) y se
// sirven con URLs firmadas de 60 segundos. El contenido del editor se sanea
// con DOMPurify antes de guardarse.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sanitizarHtml } from "@/lib/sanitizar";
import { instanteDesdeLocal } from "@/lib/fechas";
import { obtenerTimezone, type Modalidad } from "@/services/disponibilidad";

export interface ArchivoHistoria {
  id: string;
  nombre: string;
  tamano: number;
  mimeType: string;
  creadoEn: string;
}

// Datos mínimos de la cita enlazada a una nota (sin contenido clínico).
export interface CitaOrigen {
  fechaIso: string;
  finIso: string;
  modality: Modalidad;
}

export interface CitaParaNota extends CitaOrigen {
  id: string;
}

export interface SesionHistoria {
  id: string;
  fechaIso: string;
  contentHtml: string;
  creadoEn: string;
  actualizadoEn: string;
  archivos: ArchivoHistoria[];
  appointmentId: string | null;
  citaOrigen: CitaOrigen | null;
}

export interface PacienteHistorial {
  id: string;
  numero: string;
  nombre: string;
  totalSesiones: number;
  ultimaSesion: string | null;
}

export interface ResultadoHistoriales {
  pacientes: PacienteHistorial[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface HistoriaPaciente {
  paciente: { id: string; numero: string; nombre: string };
  sesiones: SesionHistoria[];
}

export interface ResultadoSesion {
  ok: boolean;
  error?: string;
  sesion?: SesionHistoria;
}

export interface ResultadoArchivo {
  ok: boolean;
  error?: string;
  archivo?: ArchivoHistoria;
}

const POR_PAGINA = 15;
const LIMITE_ARCHIVO = 15 * 1024 * 1024;
const TIPOS_ARCHIVO = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const DURACION_URL_FIRMA = 60;

interface FilaRegistro {
  id: string;
  patient_id: string;
  session_date: string;
  content: string;
  created_at: string;
  updated_at: string;
  appointment_id: string | null;
  appointment:
    | { starts_at: string; ends_at: string; modality: string }[]
    | { starts_at: string; ends_at: string; modality: string }
    | null;
}

interface FilaArchivo {
  id: string;
  clinical_record_id: string;
  patient_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

function aArchivoHistoria(f: FilaArchivo): ArchivoHistoria {
  return {
    id: f.id,
    nombre: f.file_name,
    tamano: f.file_size,
    mimeType: f.mime_type,
    creadoEn: f.created_at,
  };
}

function aCitaOrigen(f: { starts_at: string; ends_at: string; modality: string }): CitaOrigen {
  return {
    fechaIso: f.starts_at,
    finIso: f.ends_at,
    modality: f.modality === "inperson" ? "inperson" : "online",
  };
}

function aSesionHistoria(f: FilaRegistro, archivos: ArchivoHistoria[]): SesionHistoria {
  const cita = Array.isArray(f.appointment) ? f.appointment[0] : f.appointment;
  return {
    id: f.id,
    fechaIso: f.session_date,
    contentHtml: sanitizarHtml(f.content),
    creadoEn: f.created_at,
    actualizadoEn: f.updated_at,
    archivos,
    appointmentId: f.appointment_id,
    citaOrigen: cita ? aCitaOrigen(cita) : null,
  };
}

function validarFecha(fecha: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? "")) {
    return "La fecha de la sesión no es válida.";
  }
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valora que la cita exista, pertenezca al paciente y no tenga ya otra nota.
async function validarCitaParaNota(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  patientId: string,
  appointmentId: string,
  excluirRecordId?: string,
): Promise<string | null> {
  const { data: cita } = await supabase
    .from("appointments")
    .select("id, patient_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!cita) return "La cita seleccionada ya no existe.";
  if ((cita as { patient_id: string }).patient_id !== patientId) {
    return "La cita seleccionada no pertenece a este paciente.";
  }

  let q = supabase
    .from("clinical_records")
    .select("id")
    .eq("appointment_id", appointmentId)
    .limit(1);
  if (excluirRecordId) q = q.neq("id", excluirRecordId);
  const { data: enlazada } = await q;
  if ((enlazada?.length ?? 0) > 0) return "Ya existe una nota para esa cita.";
  return null;
}

// Comprueba los primeros bytes del archivo (magic numbers) para confirmar que
// el tipo real coincide con el declarado, sin confiar solo en archivo.type.
async function coincideTipoReal(archivo: File, mime: string): Promise<boolean> {
  const bytes = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());
  if (mime === "application/pdf") {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }
  if (mime === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mime === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (mime === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

function extensionDeMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "pdf";
}

function nombreMostrable(nombre: string): string {
  const limpio = (nombre ?? "")
    .slice(0, 100)
    .replace(/[\\/:*?"<>|]/g, "")
    .trim();
  return limpio || "archivo";
}

export async function listarPacientesHistorial(busqueda?: string): Promise<ResultadoHistoriales> {
  const supabase = await createServerClient();

  let q = supabase.from("patients").select("id, patient_number, full_name", { count: "exact" });
  const texto = busqueda?.trim().replace(/[,()]/g, " ");
  if (texto) {
    q = q.or(`full_name.ilike.%${texto}%,patient_number.ilike.%${texto}%`);
  }

  const { data: pacientes, count } = await q
    .order("full_name", { ascending: true })
    .range(0, POR_PAGINA - 1);

  const filas = (pacientes ?? []) as { id: string; patient_number: string; full_name: string }[];
  const ids = filas.map((p) => p.id);

  const conteos = new Map<string, { total: number; ultima: string | null }>();
  if (ids.length > 0) {
    const { data: registros } = await supabase
      .from("clinical_records")
      .select("patient_id, session_date")
      .in("patient_id", ids)
      .order("session_date", { ascending: false })
      .limit(1000);

    for (const r of (registros ?? []) as { patient_id: string; session_date: string }[]) {
      const previo = conteos.get(r.patient_id) ?? { total: 0, ultima: null };
      previo.total += 1;
      if (!previo.ultima) previo.ultima = r.session_date;
      conteos.set(r.patient_id, previo);
    }
  }

  return {
    pacientes: filas.map((p) => ({
      id: p.id,
      numero: p.patient_number,
      nombre: p.full_name,
      totalSesiones: conteos.get(p.id)?.total ?? 0,
      ultimaSesion: conteos.get(p.id)?.ultima ?? null,
    })),
    total: count ?? 0,
    pagina: 1,
    totalPaginas: Math.ceil((count ?? 0) / POR_PAGINA),
  };
}

export async function listarHistoriaPaciente(patientId: string): Promise<HistoriaPaciente | null> {
  if (!patientId) return null;
  const supabase = await createServerClient();

  const { data: paciente } = await supabase
    .from("patients")
    .select("id, patient_number, full_name")
    .eq("id", patientId)
    .maybeSingle();
  if (!paciente) return null;

  const { data: registros } = await supabase
    .from("clinical_records")
    .select(
      "id, patient_id, session_date, content, created_at, updated_at, appointment_id, appointment:appointments(starts_at, ends_at, modality)",
    )
    .eq("patient_id", patientId)
    .order("session_date", { ascending: false });

  const { data: archivos } = await supabase
    .from("clinical_files")
    .select("id, clinical_record_id, patient_id, file_path, file_name, file_size, mime_type, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });

  const porRegistro = new Map<string, ArchivoHistoria[]>();
  for (const a of (archivos ?? []) as FilaArchivo[]) {
    const lista = porRegistro.get(a.clinical_record_id) ?? [];
    lista.push(aArchivoHistoria(a));
    porRegistro.set(a.clinical_record_id, lista);
  }

  const sesiones = ((registros ?? []) as FilaRegistro[]).map((r) =>
    aSesionHistoria(r, porRegistro.get(r.id) ?? [])
  );

  return {
    paciente: {
      id: paciente.id,
      numero: paciente.patient_number,
      nombre: paciente.full_name,
    },
    sesiones,
  };
}

export async function crearSesionHistoria(
  patientId: string,
  fecha: string,
  contentHtml: string,
  appointmentId?: string | null,
): Promise<ResultadoSesion> {
  if (!patientId) return { ok: false, error: "Paciente no válido." };
  const errorFecha = validarFecha(fecha);
  if (errorFecha) return { ok: false, error: errorFecha };
  const contenido = sanitizarHtml(contentHtml ?? "");
  if (!contenido.replace(/<[^>]*>/g, "").trim() && !/<img|<hr/.test(contenido)) {
    return { ok: false, error: "La sesión necesita algún contenido." };
  }
  if (appointmentId && !UUID_RE.test(appointmentId)) {
    return { ok: false, error: "La cita seleccionada no es válida." };
  }

  const supabase = await createServerClient();
  const timezone = await obtenerTimezone();
  const instante = instanteDesdeLocal(fecha, "12:00", timezone);

  const { data: previo, error: errorPrevio } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle();
  if (errorPrevio || !previo) return { ok: false, error: "La ficha del paciente ya no existe." };

  if (appointmentId) {
    const errorCita = await validarCitaParaNota(supabase, patientId, appointmentId);
    if (errorCita) return { ok: false, error: errorCita };
  }

  const { data, error } = await supabase
    .from("clinical_records")
    .insert({
      patient_id: patientId,
      session_date: instante.toISOString(),
      content: contenido,
      appointment_id: appointmentId || null,
    })
    .select(
      "id, patient_id, session_date, content, created_at, updated_at, appointment_id, appointment:appointments(starts_at, ends_at, modality)",
    )
    .single();

  if (error || !data) return { ok: false, error: "No se pudo guardar la sesión." };
  return { ok: true, sesion: aSesionHistoria(data as unknown as FilaRegistro, []) };
}

export async function editarSesionHistoria(
  recordId: string,
  fecha: string,
  contentHtml: string,
  appointmentId?: string | null,
): Promise<ResultadoSesion> {
  if (!recordId) return { ok: false, error: "Sesión no válida." };
  const errorFecha = validarFecha(fecha);
  if (errorFecha) return { ok: false, error: errorFecha };
  const contenido = sanitizarHtml(contentHtml ?? "");
  if (!contenido.replace(/<[^>]*>/g, "").trim() && !/<img|<hr/.test(contenido)) {
    return { ok: false, error: "La sesión necesita algún contenido." };
  }
  if (appointmentId && !UUID_RE.test(appointmentId)) {
    return { ok: false, error: "La cita seleccionada no es válida." };
  }

  const supabase = await createServerClient();
  const timezone = await obtenerTimezone();
  const instante = instanteDesdeLocal(fecha, "12:00", timezone);

  const { data: previo } = await supabase
    .from("clinical_records")
    .select("id, patient_id, appointment_id")
    .eq("id", recordId)
    .maybeSingle();
  if (!previo) return { ok: false, error: "Esta sesión ya no existe." };

  if (appointmentId && appointmentId !== (previo as { appointment_id: string | null }).appointment_id) {
    const errorCita = await validarCitaParaNota(
      supabase,
      (previo as { patient_id: string }).patient_id,
      appointmentId,
      recordId,
    );
    if (errorCita) return { ok: false, error: errorCita };
  }

  const { data, error } = await supabase
    .from("clinical_records")
    .update({
      session_date: instante.toISOString(),
      content: contenido,
      appointment_id: appointmentId || null,
    })
    .eq("id", recordId)
    .select(
      "id, patient_id, session_date, content, created_at, updated_at, appointment_id, appointment:appointments(starts_at, ends_at, modality)",
    )
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  const { data: archivos } = await supabase
    .from("clinical_files")
    .select("id, clinical_record_id, patient_id, file_path, file_name, file_size, mime_type, created_at")
    .eq("clinical_record_id", recordId)
    .order("created_at", { ascending: true });

  return {
    ok: true,
    sesion: aSesionHistoria(data as unknown as FilaRegistro, ((archivos ?? []) as FilaArchivo[]).map(aArchivoHistoria)),
  };
}

// Citas pasadas del paciente que aún no tienen nota enlazada (para el
// selector de "cita de origen" al crear o editar una sesión).
export async function listarCitasParaNota(
  patientId: string,
  excluirRecordId?: string,
): Promise<CitaParaNota[]> {
  if (!patientId) return [];
  const supabase = await createServerClient();

  const { data: citas } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, modality, clinical_records(id)")
    .eq("patient_id", patientId)
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(50);

  const resultado: CitaParaNota[] = [];
  for (const c of (citas ?? []) as {
    id: string;
    starts_at: string;
    ends_at: string;
    modality: string;
    clinical_records: { id: string }[] | null;
  }[]) {
    const enlazada = c.clinical_records ?? [];
    const ocupadaPorOtra = enlazada.some((r) => r.id !== excluirRecordId);
    if (ocupadaPorOtra) continue;
    resultado.push({
      id: c.id,
      fechaIso: c.starts_at,
      finIso: c.ends_at,
      modality: c.modality === "inperson" ? "inperson" : "online",
    });
  }
  return resultado;
}

export async function borrarSesionHistoria(recordId: string): Promise<{ ok: boolean; error?: string }> {
  if (!recordId) return { ok: false, error: "Sesión no válida." };
  const supabase = await createServerClient();

  const { data: archivos } = await supabase
    .from("clinical_files")
    .select("id, file_path")
    .eq("clinical_record_id", recordId);

  const paths = ((archivos ?? []) as { file_path: string }[]).map((a) => a.file_path);
  if (paths.length > 0) {
    await supabase.storage.from("clinical-files").remove(paths);
  }

  const { error } = await supabase.from("clinical_records").delete().eq("id", recordId);
  if (error) return { ok: false, error: "No se pudo eliminar la sesión." };
  return { ok: true };
}

export async function subirArchivoHistoria(
  recordId: string,
  archivo: File,
): Promise<ResultadoArchivo> {
  if (!recordId || !archivo || archivo.size === 0) {
    return { ok: false, error: "No se ha seleccionado ningún archivo." };
  }
  if (!TIPOS_ARCHIVO.includes(archivo.type)) {
    return { ok: false, error: "Solo se permiten imágenes JPG, PNG, WebP o documentos PDF." };
  }
  if (archivo.size > LIMITE_ARCHIVO) {
    return { ok: false, error: "El archivo no debe superar 15 MB." };
  }
  if (!(await coincideTipoReal(archivo, archivo.type))) {
    return { ok: false, error: "El contenido del archivo no coincide con su tipo." };
  }

  const supabase = await createServerClient();

  const { data: sesion } = await supabase
    .from("clinical_records")
    .select("id, patient_id")
    .eq("id", recordId)
    .maybeSingle();
  if (!sesion) return { ok: false, error: "Esta sesión ya no existe." };

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, error: "Sesión caducada. Vuelve a entrar al panel." };

  const extension = extensionDeMime(archivo.type);
  const path = `${uid}/${sesion.patient_id}/${crypto.randomUUID()}.${extension}`;

  const { error: errorUpload } = await supabase.storage
    .from("clinical-files")
    .upload(path, archivo, { contentType: archivo.type, upsert: false });
  if (errorUpload) return { ok: false, error: "No se pudo subir el archivo." };

  const { data: fila, error: errorInsert } = await supabase
    .from("clinical_files")
    .insert({
      clinical_record_id: recordId,
      patient_id: sesion.patient_id,
      file_path: path,
      file_name: nombreMostrable(archivo.name),
      file_size: archivo.size,
      mime_type: archivo.type,
    })
    .select("id, clinical_record_id, patient_id, file_path, file_name, file_size, mime_type, created_at")
    .single();

  if (errorInsert || !fila) {
    await supabase.storage.from("clinical-files").remove([path]);
    return { ok: false, error: "No se pudo registrar el archivo." };
  }

  return { ok: true, archivo: aArchivoHistoria(fila as unknown as FilaArchivo) };
}

export async function borrarArchivoHistoria(fileId: string): Promise<{ ok: boolean; error?: string }> {
  if (!fileId) return { ok: false, error: "Archivo no válido." };
  const supabase = await createServerClient();

  const { data: fila } = await supabase
    .from("clinical_files")
    .select("id, file_path")
    .eq("id", fileId)
    .maybeSingle();
  if (!fila) return { ok: true };

  const { error: errorUpload } = await supabase.storage
    .from("clinical-files")
    .remove([fila.file_path as string]);
  if (errorUpload) return { ok: false, error: "No se pudo borrar el archivo del almacenamiento." };

  const { error } = await supabase.from("clinical_files").delete().eq("id", fileId);
  if (error) return { ok: false, error: "No se pudo borrar el archivo." };
  return { ok: true };
}

export async function urlFirmadaArchivo(fileId: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!fileId) return { ok: false, error: "Archivo no válido." };
  const supabase = await createServerClient();

  const { data: fila } = await supabase
    .from("clinical_files")
    .select("id, file_path")
    .eq("id", fileId)
    .maybeSingle();
  if (!fila) return { ok: false, error: "Este archivo ya no existe." };

  const { data, error } = await supabase.storage
    .from("clinical-files")
    .createSignedUrl(fila.file_path as string, DURACION_URL_FIRMA);

  if (error || !data?.signedUrl) return { ok: false, error: "No se pudo abrir el archivo." };
  return { ok: true, url: data.signedUrl };
}
