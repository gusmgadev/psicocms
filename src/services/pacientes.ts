// src/services/pacientes.ts
// Directorio de pacientes: listado, ficha, alta, edición, exportación,
// anonimización y borrado. El teléfono es dato de contacto (solo dígitos, no único).
// El identificador es el id UUID; las urls del panel lo usan, nunca el teléfono.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface PacienteFila {
  id: string;
  numero: string;
  nombre: string;
  telefono: string;
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  possibleDuplicate: boolean;
  consentAt: string | null;
  consentVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FiltroPacientes {
  pagina?: number;
  porPagina?: number;
  busqueda?: string;
  soloDuplicados?: boolean;
}

export interface ResultadoPacientes {
  pacientes: PacienteFila[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface InputPaciente {
  nombre: string;
  telefono: string;
  email?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  notes?: string;
  possibleDuplicate?: boolean;
}

export interface ResultadoPaciente {
  ok: boolean;
  error?: string;
  aviso?: string;
  paciente?: PacienteFila;
}

export interface CitaResumenPaciente {
  id: string;
  modality: string;
  startsAt: string;
  endsAt: string;
  status: string;
  reason: string | null;
  origin: string;
}

const POR_PAGINA = 15;
const GENEROS = ["femenino", "masculino", "otro", "no especificado"];

interface FilaPaciente {
  id: string;
  patient_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  possible_duplicate: boolean;
  consent_at: string | null;
  consent_version: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNAS =
  "id, patient_number, full_name, phone, email, birth_date, gender, address, notes, possible_duplicate, consent_at, consent_version, created_at, updated_at";

function aPacienteFila(f: FilaPaciente): PacienteFila {
  return {
    id: f.id,
    numero: f.patient_number,
    nombre: f.full_name,
    telefono: f.phone,
    email: f.email,
    birthDate: f.birth_date,
    gender: f.gender,
    address: f.address,
    notes: f.notes,
    possibleDuplicate: f.possible_duplicate,
    consentAt: f.consent_at,
    consentVersion: f.consent_version,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
}

function validarInput(input: InputPaciente): string | null {
  const nombre = (input.nombre ?? "").trim();
  if (nombre.length < 2 || nombre.length > 100) {
    return "El nombre debe tener entre 2 y 100 caracteres.";
  }
  const telefono = (input.telefono ?? "").replace(/\D/g, "");
  if (!/^\d{6,15}$/.test(telefono)) {
    return "El teléfono debe contener solo números (entre 6 y 15 dígitos).";
  }
  const email = (input.email ?? "").trim();
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return "El email no es válido.";
  }
  const birthDate = (input.birthDate ?? "").trim();
  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return "La fecha de nacimiento no es válida.";
  }
  if (input.gender && !GENEROS.includes(input.gender)) {
    return "El género no es válido.";
  }
  if ((input.address ?? "").length > 250) {
    return "La dirección es demasiado larga (máximo 250 caracteres).";
  }
  if ((input.notes ?? "").length > 2000) {
    return "Las notas son demasiado largas (máximo 2000 caracteres).";
  }
  return null;
}

function limpiarInput(input: InputPaciente) {
  return {
    full_name: input.nombre.trim(),
    phone: input.telefono.replace(/\D/g, ""),
    email: (input.email ?? "").trim() || null,
    birth_date: (input.birthDate ?? "").trim() || null,
    gender: (input.gender ?? "").trim() || null,
    address: (input.address ?? "").trim() || null,
    notes: (input.notes ?? "").trim() || null,
  };
}

async function telefonoYaExiste(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  telefono: string,
  excluirId?: string,
): Promise<boolean> {
  let q = supabase.from("patients").select("id").eq("phone", telefono).limit(1);
  if (excluirId) q = q.neq("id", excluirId);
  const { data } = await q;
  return (data?.length ?? 0) > 0;
}

export async function listarPacientes(filtro: FiltroPacientes): Promise<ResultadoPacientes> {
  const supabase = await createServerClient();
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const porPagina = filtro.porPagina ?? POR_PAGINA;

  let q = supabase.from("patients").select(COLUMNAS, { count: "exact" });

  if (filtro.soloDuplicados) {
    q = q.eq("possible_duplicate", true);
  }

  const busqueda = filtro.busqueda?.trim().replace(/[,()]/g, " ");
  if (busqueda) {
    q = q.or(`full_name.ilike.%${busqueda}%,phone.ilike.%${busqueda}%,patient_number.ilike.%${busqueda}%`);
  }

  const desde = (pagina - 1) * porPagina;
  const { data, count, error } = await q
    .order("full_name", { ascending: true })
    .range(desde, desde + porPagina - 1);

  if (error) {
    return { pacientes: [], total: 0, pagina: 1, totalPaginas: 0 };
  }

  const total = count ?? 0;
  return {
    pacientes: ((data ?? []) as unknown as FilaPaciente[]).map(aPacienteFila),
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}

export async function obtenerPaciente(id: string): Promise<PacienteFila | null> {
  if (!id) return null;
  const supabase = await createServerClient();
  const { data } = await supabase.from("patients").select(COLUMNAS).eq("id", id).maybeSingle();
  if (!data) return null;
  return aPacienteFila(data as unknown as FilaPaciente);
}

export async function listarCitasDelPaciente(id: string): Promise<CitaResumenPaciente[]> {
  if (!id) return [];
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, modality, starts_at, ends_at, status, reason, origin")
    .eq("patient_id", id)
    .order("starts_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as { id: string; modality: string; starts_at: string; ends_at: string; status: string; reason: string | null; origin: string }[]).map((c) => ({
    id: c.id,
    modality: c.modality,
    startsAt: c.starts_at,
    endsAt: c.ends_at,
    status: c.status,
    reason: c.reason,
    origin: c.origin,
  }));
}

export async function crearPaciente(input: InputPaciente): Promise<ResultadoPaciente> {
  const errorValidacion = validarInput(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const datos = limpiarInput(input);
  const duplicado = await telefonoYaExiste(supabase, datos.phone);

  const { data, error } = await supabase
    .from("patients")
    .insert({ ...datos, possible_duplicate: duplicado })
    .select(COLUMNAS)
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear el paciente." };

  return {
    ok: true,
    paciente: aPacienteFila(data as unknown as FilaPaciente),
    aviso: duplicado ? "Ya existe un paciente con este teléfono, ¿es la misma persona?" : undefined,
  };
}

export async function editarPaciente(id: string, input: InputPaciente): Promise<ResultadoPaciente> {
  if (!id) return { ok: false, error: "Paciente no válido." };
  const errorValidacion = validarInput(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: previo } = await supabase
    .from("patients")
    .select("id, phone")
    .eq("id", id)
    .maybeSingle();
  if (!previo) return { ok: false, error: "La ficha del paciente ya no existe." };

  const datos = limpiarInput(input);
  const telefonoCambio = datos.phone !== previo.phone;
  let duplicado: boolean;
  if (input.possibleDuplicate === true) {
    duplicado = true;
  } else if (input.possibleDuplicate === false) {
    duplicado = telefonoCambio ? await telefonoYaExiste(supabase, datos.phone, id) : false;
  } else {
    duplicado = await telefonoYaExiste(supabase, datos.phone, id);
  }

  const { data, error } = await supabase
    .from("patients")
    .update({ ...datos, possible_duplicate: duplicado })
    .eq("id", id)
    .select(COLUMNAS)
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  const aviso = duplicado && input.possibleDuplicate !== true && input.possibleDuplicate !== false
    ? "Ya existe un paciente con este teléfono, ¿es la misma persona?"
    : undefined;

  return { ok: true, paciente: aPacienteFila(data as unknown as FilaPaciente), aviso };
}

export interface SesionExportada {
  id: string;
  fecha: string;
  contenidoHtml: string;
  archivos: { nombre: string; tamano: number; mimeType: string }[];
}

export interface ExportacionPaciente {
  exportadoEn: string;
  paciente: PacienteFila;
  citas: CitaResumenPaciente[];
  historias: SesionExportada[];
}

export async function exportarPaciente(id: string): Promise<ExportacionPaciente | null> {
  const paciente = await obtenerPaciente(id);
  if (!paciente) return null;
  const citas = await listarCitasDelPaciente(id);
  const historias = await exportarHistoriasDelPaciente(id);
  return { exportadoEn: new Date().toISOString(), paciente, citas, historias };
}

async function exportarHistoriasDelPaciente(id: string): Promise<SesionExportada[]> {
  const supabase = await createServerClient();

  const { data: registros } = await supabase
    .from("clinical_records")
    .select("id, session_date, content")
    .eq("patient_id", id)
    .order("session_date", { ascending: false });
  if (!registros || registros.length === 0) return [];

  const { data: archivos } = await supabase
    .from("clinical_files")
    .select("clinical_record_id, file_name, file_size, mime_type")
    .eq("patient_id", id);

  const porRegistro = new Map<string, { nombre: string; tamano: number; mimeType: string }[]>();
  for (const a of (archivos ?? []) as { clinical_record_id: string; file_name: string; file_size: number; mime_type: string }[]) {
    const lista = porRegistro.get(a.clinical_record_id) ?? [];
    lista.push({ nombre: a.file_name, tamano: a.file_size, mimeType: a.mime_type });
    porRegistro.set(a.clinical_record_id, lista);
  }

  return ((registros ?? []) as { id: string; session_date: string; content: string }[]).map((r) => ({
    id: r.id,
    fecha: r.session_date,
    contenidoHtml: r.content,
    archivos: porRegistro.get(r.id) ?? [],
  }));
}

export async function anonimizarPaciente(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Paciente no válido." };
  const supabase = await createServerClient();

  const { data: previo } = await supabase
    .from("patients")
    .select("id, patient_number")
    .eq("id", id)
    .maybeSingle();
  if (!previo) return { ok: false, error: "La ficha del paciente ya no existe." };

  const { error } = await supabase
    .from("patients")
    .update({
      full_name: `Paciente ${previo.patient_number}`,
      phone: "000000000",
      email: null,
      birth_date: null,
      gender: null,
      address: null,
      notes: null,
      possible_duplicate: false,
    })
    .eq("id", id);

  if (error) return { ok: false, error: "No se pudo anonimizar la ficha." };
  return { ok: true };
}

export async function eliminarPaciente(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Paciente no válido." };
  const supabase = await createServerClient();

  const { data: previo } = await supabase.from("patients").select("id").eq("id", id).maybeSingle();
  if (!previo) return { ok: true };

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error:
        "Este paciente tiene citas asociadas. Si quieres borrar sus datos personales, usa la anonimización (conserva las citas sin datos).",
    };
  }

  const { count: historias } = await supabase
    .from("clinical_records")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", id);

  if ((historias ?? 0) > 0) {
    return {
      ok: false,
      error:
        "Este paciente tiene historias clínicas asociadas. Si quieres borrar sus datos personales, usa la anonimización (conserva el seguimiento sin datos).",
    };
  }

  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la ficha." };
  return { ok: true };
}
