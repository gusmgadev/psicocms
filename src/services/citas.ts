// src/services/citas.ts
// Citas del panel: listado con filtros, creación, edición y borrado.
// Reglas: los rangos no se solapan con NINGUNA modalidad; en la misma modalidad
// además se respeta el descanso (ventana de paso = sesión + descanso).
// (validación en servidor; la restricción de exclusión de la BD es la garantía final).

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { obtenerTimezone, type Modalidad } from "@/services/disponibilidad";
import { instanteDesdeLocal, sumarDias } from "@/lib/fechas";

export type EstadoCita = "scheduled" | "completed" | "cancelled" | "no_show";

export interface FiltroCitas {
  pagina?: number;
  porPagina?: number;
  estado?: string;
  modality?: string;
  desde?: string; // YYYY-MM-DD local
  hasta?: string; // YYYY-MM-DD local (inclusive)
  busqueda?: string;
}

export interface CitaFila {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteTelefono: string;
  pacienteNumero: string;
  modality: Modalidad;
  startsAt: string;
  endsAt: string;
  status: EstadoCita;
  reason: string | null;
  origin: "web" | "manual";
  notaId: string | null;
}

export interface ResultadoCitas {
  citas: CitaFila[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface PacienteSelector {
  id: string;
  nombre: string;
  telefono: string;
  numero: string;
}

export interface InputCita {
  patientId?: string;
  nuevoPaciente?: { nombre: string; telefono: string };
  modality: Modalidad;
  fecha: string; // YYYY-MM-DD local
  hora: string; // HH:MM local
  status?: EstadoCita;
  reason?: string;
}

export interface ResultadoCita {
  ok: boolean;
  error?: string;
  aviso?: string;
  cita?: CitaFila;
}

const ESTADOS: EstadoCita[] = ["scheduled", "completed", "cancelled", "no_show"];
const POR_PAGINA = 10;

interface FilaCita {
  id: string;
  patient_id: string;
  modality: string;
  starts_at: string;
  ends_at: string;
  status: string;
  reason: string | null;
  origin: string;
  patient: { full_name: string; phone: string; patient_number: string } | null;
  clinical_records: { id: string }[] | null;
}

function aCitaFila(f: FilaCita): CitaFila {
  return {
    id: f.id,
    pacienteId: f.patient_id,
    pacienteNombre: f.patient?.full_name ?? "",
    pacienteTelefono: f.patient?.phone ?? "",
    pacienteNumero: f.patient?.patient_number ?? "",
    modality: f.modality as Modalidad,
    startsAt: f.starts_at,
    endsAt: f.ends_at,
    status: f.status as EstadoCita,
    reason: f.reason,
    origin: f.origin as "web" | "manual",
    notaId: f.clinical_records?.[0]?.id ?? null,
  };
}

const SELECT_CITA =
  "id, patient_id, modality, starts_at, ends_at, status, reason, origin, patient:patients(full_name, phone, patient_number), clinical_records(id)";

function esErrorSolapamiento(error: { code?: string | null; message?: string | null }): boolean {
  return error.code === "23P01" || Boolean(error.message?.includes("exclusion"));
}

async function leerConfiguracion(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  modality: Modalidad,
): Promise<{ duracion: number; paso: number }> {
  const { data } = await supabase
    .from("professional_profile")
    .select(
      "session_duration_online, session_duration_inperson, break_between_sessions_online, break_between_sessions_inperson, break_enabled_online, break_enabled_inperson",
    )
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { duracion: 50, paso: 50 };

  const fila = data as {
    session_duration_online: number;
    session_duration_inperson: number;
    break_between_sessions_online: number;
    break_between_sessions_inperson: number;
    break_enabled_online: boolean;
    break_enabled_inperson: boolean;
  };

  if (modality === "online") {
    const duracion = fila.session_duration_online;
    return { duracion, paso: duracion + (fila.break_enabled_online ? fila.break_between_sessions_online : 0) };
  }
  const duracion = fila.session_duration_inperson;
  return { duracion, paso: duracion + (fila.break_enabled_inperson ? fila.break_between_sessions_inperson : 0) };
}

async function hayConflicto(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  params: { modality: Modalidad; startsAt: Date; endsAt: Date; paso: number; excluirId?: string },
): Promise<boolean> {
  const ventanaFin = new Date(params.startsAt.getTime() + params.paso * 60_000);
  const ventanaInicio = new Date(params.startsAt.getTime() - params.paso * 60_000);

  // Misma modalidad: otro inicio dentro de ±paso respeta el descanso entre sesiones
  let qMisma = supabase
    .from("appointments")
    .select("id")
    .eq("modality", params.modality)
    .in("status", ["scheduled", "completed"])
    .lt("starts_at", ventanaFin.toISOString())
    .gt("starts_at", ventanaInicio.toISOString())
    .limit(1);

  if (params.excluirId) qMisma = qMisma.neq("id", params.excluirId);

  const { data: mismaModalidad } = await qMisma;
  if ((mismaModalidad?.length ?? 0) > 0) return true;

  // Cualquier modalidad: los rangos almacenados no pueden solaparse
  let qCualquiera = supabase
    .from("appointments")
    .select("id")
    .in("status", ["scheduled", "completed"])
    .lt("starts_at", params.endsAt.toISOString())
    .gt("ends_at", params.startsAt.toISOString())
    .limit(1);

  if (params.excluirId) qCualquiera = qCualquiera.neq("id", params.excluirId);

  const { data: cualquierModalidad } = await qCualquiera;
  return (cualquierModalidad?.length ?? 0) > 0;
}

export async function listarCitas(filtro: FiltroCitas): Promise<ResultadoCitas> {
  const supabase = await createServerClient();
  const timezone = await obtenerTimezone();

  const pagina = Math.max(1, filtro.pagina ?? 1);
  const porPagina = filtro.porPagina ?? POR_PAGINA;

  let q = supabase
    .from("appointments")
    .select(SELECT_CITA, { count: "exact" });

  if (filtro.estado && ESTADOS.includes(filtro.estado as EstadoCita)) {
    q = q.eq("status", filtro.estado);
  }
  if (filtro.modality === "online" || filtro.modality === "inperson") {
    q = q.eq("modality", filtro.modality);
  }
  if (filtro.desde) {
    q = q.gte("starts_at", instanteDesdeLocal(filtro.desde, "00:00", timezone).toISOString());
  }
  if (filtro.hasta) {
    q = q.lt("starts_at", instanteDesdeLocal(sumarDias(filtro.hasta, 1), "00:00", timezone).toISOString());
  }

  const busqueda = filtro.busqueda?.trim().replace(/[,()]/g, " ");
  if (busqueda) {
    const { data: encontrados } = await supabase
      .from("patients")
      .select("id")
      .or(`full_name.ilike.%${busqueda}%,phone.ilike.%${busqueda}%,patient_number.ilike.%${busqueda}%`);
    const ids = (encontrados ?? []).map((p) => (p as { id: string }).id);
    if (ids.length === 0) {
      return { citas: [], total: 0, pagina: 1, totalPaginas: 0 };
    }
    q = q.in("patient_id", ids);
  }

  const desde = (pagina - 1) * porPagina;
  const { data, count, error } = await q
    .order("starts_at", { ascending: true })
    .range(desde, desde + porPagina - 1);

  if (error) {
    return { citas: [], total: 0, pagina: 1, totalPaginas: 0 };
  }

  const total = count ?? 0;
  return {
    citas: ((data ?? []) as unknown as FilaCita[]).map(aCitaFila),
    total,
    pagina,
    totalPaginas: Math.ceil(total / porPagina),
  };
}

export async function listarPacientesParaCita(): Promise<PacienteSelector[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("patients")
    .select("id, full_name, phone, patient_number")
    .order("full_name");

  return ((data ?? []) as { id: string; full_name: string; phone: string; patient_number: string }[]).map((p) => ({
    id: p.id,
    nombre: p.full_name,
    telefono: p.phone,
    numero: p.patient_number,
  }));
}

async function resolverPaciente(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  input: InputCita,
): Promise<{ ok: true; pacienteId: string; aviso?: string } | { ok: false; error: string }> {
  if (input.patientId) {
    return { ok: true, pacienteId: input.patientId };
  }

  const nuevo = input.nuevoPaciente;
  if (!nuevo) return { ok: false, error: "Selecciona un paciente o crea uno nuevo." };

  const nombre = nuevo.nombre.trim();
  if (nombre.length < 2 || nombre.length > 100) {
    return { ok: false, error: "El nombre del paciente no es válido." };
  }

  const telefono = nuevo.telefono.replace(/\D/g, "");
  if (!/^\d{6,15}$/.test(telefono)) {
    return { ok: false, error: "El teléfono debe contener solo números (entre 6 y 15 dígitos)." };
  }

  const { data: existente } = await supabase.from("patients").select("id").eq("phone", telefono).limit(1);
  const telefonoYaExiste = (existente?.length ?? 0) > 0;

  const { data, error } = await supabase
    .from("patients")
    .insert({ full_name: nombre, phone: telefono, possible_duplicate: telefonoYaExiste })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear el paciente." };

  return {
    ok: true,
    pacienteId: data.id as string,
    aviso: telefonoYaExiste ? "Ya existe un paciente con este teléfono, ¿es la misma persona?" : undefined,
  };
}

export async function crearCita(input: InputCita): Promise<ResultadoCita> {
  if (input.modality !== "online" && input.modality !== "inperson") {
    return { ok: false, error: "Modalidad no válida." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha) || !/^\d{2}:\d{2}$/.test(input.hora)) {
    return { ok: false, error: "La fecha y la hora no son válidas." };
  }
  if (input.reason && input.reason.length > 500) {
    return { ok: false, error: "El motivo es demasiado largo (máximo 500 caracteres)." };
  }
  if (input.status && !ESTADOS.includes(input.status)) {
    return { ok: false, error: "Estado no válido." };
  }

  const supabase = await createServerClient();
  const timezone = await obtenerTimezone();

  const { duracion, paso } = await leerConfiguracion(supabase, input.modality);
  const startsAt = instanteDesdeLocal(input.fecha, input.hora, timezone);
  const endsAt = new Date(startsAt.getTime() + duracion * 60_000);

  const estadoFinal = input.status ?? "scheduled";
  if (estadoFinal === "scheduled" && startsAt.getTime() < Date.now()) {
    return {
      ok: false,
      error:
        "No se pueden programar citas en el pasado. Si quieres registrar una sesión pasada, cambia el estado a Completada, No presentó o Cancelada.",
    };
  }

  if (await hayConflicto(supabase, { modality: input.modality, startsAt, endsAt, paso })) {
    return { ok: false, error: "Ese horario no está disponible: se solapa con otra cita (sea la modalidad que sea) o no deja el descanso entre sesiones." };
  }

  const paciente = await resolverPaciente(supabase, input);
  if (!paciente.ok) return { ok: false, error: paciente.error };

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: paciente.pacienteId,
      modality: input.modality,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: input.status ?? "scheduled",
      reason: input.reason?.trim() || null,
      origin: "manual",
    })
    .select(SELECT_CITA)
    .single();

  if (error || !data) {
    if (error && esErrorSolapamiento(error)) {
      return { ok: false, error: "Ese horario ya está ocupado por otra cita." };
    }
    return { ok: false, error: "No se pudo crear la cita." };
  }

  return { ok: true, cita: aCitaFila(data as unknown as FilaCita), aviso: paciente.aviso };
}

export async function editarCita(id: string, input: InputCita): Promise<ResultadoCita> {
  if (!id) return { ok: false, error: "Cita no válida." };
  if (input.modality !== "online" && input.modality !== "inperson") {
    return { ok: false, error: "Modalidad no válida." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha) || !/^\d{2}:\d{2}$/.test(input.hora)) {
    return { ok: false, error: "La fecha y la hora no son válidas." };
  }
  if (input.reason && input.reason.length > 500) {
    return { ok: false, error: "El motivo es demasiado largo (máximo 500 caracteres)." };
  }
  if (input.status && !ESTADOS.includes(input.status)) {
    return { ok: false, error: "Estado no válido." };
  }

  const supabase = await createServerClient();
  const timezone = await obtenerTimezone();

  const { data: previa } = await supabase
    .from("appointments")
    .select("id, patient_id, status, origin, reason")
    .eq("id", id)
    .maybeSingle();

  if (!previa) return { ok: false, error: "La cita ya no existe." };

  const { duracion, paso } = await leerConfiguracion(supabase, input.modality);
  const startsAt = instanteDesdeLocal(input.fecha, input.hora, timezone);
  const endsAt = new Date(startsAt.getTime() + duracion * 60_000);

  const estadoFinal = input.status ?? (previa.status as EstadoCita);
  if (estadoFinal === "scheduled" && startsAt.getTime() < Date.now()) {
    return {
      ok: false,
      error:
        "No se pueden programar citas en el pasado. Si quieres registrar una sesión pasada, cambia el estado a Completada, No presentó o Cancelada.",
    };
  }

  if (await hayConflicto(supabase, { modality: input.modality, startsAt, endsAt, paso, excluirId: id })) {
    return { ok: false, error: "Ese horario no está disponible: se solapa con otra cita (sea la modalidad que sea) o no deja el descanso entre sesiones." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      modality: input.modality,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: input.status ?? (previa.status as EstadoCita),
      reason: input.reason?.trim() || null,
    })
    .eq("id", id)
    .select(SELECT_CITA)
    .single();

  if (error || !data) {
    if (error && esErrorSolapamiento(error)) {
      return { ok: false, error: "Ese horario ya está ocupado por otra cita." };
    }
    return { ok: false, error: "No se pudo guardar los cambios." };
  }

  if (estadoFinal === "cancelled" && previa.status !== "cancelled") {
    await supabase.from("clinical_records").update({ appointment_id: null }).eq("appointment_id", id);
  }

  return { ok: true, cita: aCitaFila(data as unknown as FilaCita) };
}

export async function eliminarCita(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Cita no válida." };
  const supabase = await createServerClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la cita." };
  return { ok: true };
}
