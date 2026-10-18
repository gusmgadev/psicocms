// src/services/dashboard.ts
// Datos reales de la página de inicio del panel (consultas con sesión = RLS por is_owner()).

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { obtenerTimezone, type Modalidad } from "@/services/disponibilidad";
import { hoyEnZona, lunesDeLaSemana, instanteDesdeLocal, sumarDias } from "@/lib/fechas";

export interface CitaResumen {
  id: string;
  startsAt: string;
  modality: Modalidad;
  pacienteNombre: string;
}

export interface PacienteResumen {
  id: string;
  nombre: string;
  numero: string;
  createdAt: string;
}

export interface ResumenInicio {
  citasSemana: number;
  pacientesActivos: number;
  proximasCitas: number;
  nuevosPacientes: number;
  proximasCitasLista: CitaResumen[];
  pacientesRecientes: PacienteResumen[];
}

interface FilaCitaResumen {
  id: string;
  starts_at: string;
  modality: string;
  patient: { full_name: string } | null;
}

interface FilaPacienteResumen {
  id: string;
  full_name: string;
  patient_number: string;
  created_at: string;
}

export async function getResumenInicio(): Promise<ResumenInicio> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      citasSemana: 0,
      pacientesActivos: 0,
      proximasCitas: 0,
      nuevosPacientes: 0,
      proximasCitasLista: [],
      pacientesRecientes: [],
    };
  }

  const timezone = await obtenerTimezone();
  const hoy = hoyEnZona(timezone);
  const lunes = lunesDeLaSemana(hoy);
  const proximoLunes = sumarDias(lunes, 7);
  const inicioMes = `${hoy.slice(0, 7)}-01`;
  const ahoraIso = new Date().toISOString();

  const semanaDesde = instanteDesdeLocal(lunes, "00:00", timezone).toISOString();
  const semanaHasta = instanteDesdeLocal(proximoLunes, "00:00", timezone).toISOString();
  const mesDesde = instanteDesdeLocal(inicioMes, "00:00", timezone).toISOString();

  const [semana, pacientes, futuras, nuevas, proximas, recientes] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", semanaDesde)
      .lt("starts_at", semanaHasta)
      .in("status", ["scheduled", "completed"]),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gt("starts_at", ahoraIso)
      .eq("status", "scheduled"),
    supabase.from("patients").select("id", { count: "exact", head: true }).gte("created_at", mesDesde),
    supabase
      .from("appointments")
      .select("id, starts_at, modality, patient:patients(full_name)")
      .gt("starts_at", ahoraIso)
      .eq("status", "scheduled")
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase
      .from("patients")
      .select("id, full_name, patient_number, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    citasSemana: semana.count ?? 0,
    pacientesActivos: pacientes.count ?? 0,
    proximasCitas: futuras.count ?? 0,
    nuevosPacientes: nuevas.count ?? 0,
    proximasCitasLista: ((proximas.data ?? []) as unknown as FilaCitaResumen[]).map((c) => ({
      id: c.id,
      startsAt: c.starts_at,
      modality: c.modality as Modalidad,
      pacienteNombre: c.patient?.full_name ?? "",
    })),
    pacientesRecientes: ((recientes.data ?? []) as unknown as FilaPacienteResumen[]).map((p) => ({
      id: p.id,
      nombre: p.full_name,
      numero: p.patient_number,
      createdAt: p.created_at,
    })),
  };
}
