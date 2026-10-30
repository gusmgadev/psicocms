// src/services/disponibilidad.ts
// Disponibilidad: duración/descanso por modalidad, huecos semanales y vacaciones.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public-server";
import { textoAMinutos, minutosATexto } from "@/lib/fechas";

export type Modalidad = "online" | "inperson";

export interface ConfigSesiones {
  durationOnline: number;
  durationInperson: number;
  breakOnline: number;
  breakInperson: number;
  breakEnabledOnline: boolean;
  breakEnabledInperson: boolean;
}

export interface MarcaHueco {
  dayOfWeek: number;
  startTime: string; // HH:MM:SS (hora local)
}

export interface HuecoGuardado extends MarcaHueco {
  modality: Modalidad;
}

export interface PeriodoVacaciones {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  note: string | null;
}

export interface EstadoDisponibilidad {
  config: ConfigSesiones;
  vacationMode: boolean;
  timezone: string;
  slots: HuecoGuardado[];
  periodos: PeriodoVacaciones[];
}

interface Resultado {
  ok: boolean;
  error?: string;
}

interface ResultadoConfig extends Resultado {
  avisos?: string[];
}

interface ResultadoPeriodo extends Resultado {
  periodo?: PeriodoVacaciones;
}

interface FilaPerfil {
  session_duration_online: number;
  session_duration_inperson: number;
  break_between_sessions_online: number;
  break_between_sessions_inperson: number;
  break_enabled_online: boolean;
  break_enabled_inperson: boolean;
}

interface FilaAjustes {
  vacation_mode: boolean;
  timezone: string | null;
}

const LIMITE_DURACION = { min: 5, max: 240 };
const LIMITE_DESCANSO = { min: 0, max: 120 };

function validarConfig(config: ConfigSesiones): string | null {
  const duraciones = [config.durationOnline, config.durationInperson];
  const descansos = [config.breakOnline, config.breakInperson];
  for (const d of duraciones) {
    if (!Number.isInteger(d) || d < LIMITE_DURACION.min || d > LIMITE_DURACION.max) {
      return `La duración de sesión debe estar entre ${LIMITE_DURACION.min} y ${LIMITE_DURACION.max} minutos.`;
    }
  }
  for (const b of descansos) {
    if (!Number.isInteger(b) || b < LIMITE_DESCANSO.min || b > LIMITE_DESCANSO.max) {
      return `El descanso debe estar entre ${LIMITE_DESCANSO.min} y ${LIMITE_DESCANSO.max} minutos.`;
    }
  }
  return null;
}

async function leerPerfil(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<FilaPerfil | null> {
  const { data } = await supabase
    .from("professional_profile")
    .select(
      "session_duration_online, session_duration_inperson, break_between_sessions_online, break_between_sessions_inperson, break_enabled_online, break_enabled_inperson",
    )
    .eq("is_active", true)
    .maybeSingle();
  return data as FilaPerfil | null;
}

export async function obtenerTimezone(): Promise<string> {
  try {
    // Cliente anon: la zona horaria pública se lee igual estés logueada o no.
    const supabase = createPublicClient();
    const { data } = await supabase.from("site_settings").select("timezone").eq("id", true).maybeSingle();
    const fila = data as { timezone: string | null } | null;
    return fila?.timezone || "America/Argentina/Buenos_Aires";
  } catch {
    return "America/Argentina/Buenos_Aires";
  }
}

export async function getEstadoDisponibilidad(): Promise<EstadoDisponibilidad> {
  const supabase = await createServerClient();

  const [perfil, ajustes, slots, periodos] = await Promise.all([
    leerPerfil(supabase),
    supabase.from("site_settings").select("vacation_mode, timezone").eq("id", true).maybeSingle(),
    supabase.from("availability_slots").select("modality, day_of_week, start_time").order("day_of_week").order("start_time"),
    supabase.from("vacation_periods").select("id, start_date, end_date, note").order("start_date"),
  ]);

  const filaAjustes = ajustes.data as FilaAjustes | null;

  return {
    config: perfil
      ? {
          durationOnline: perfil.session_duration_online,
          durationInperson: perfil.session_duration_inperson,
          breakOnline: perfil.break_between_sessions_online,
          breakInperson: perfil.break_between_sessions_inperson,
          breakEnabledOnline: perfil.break_enabled_online,
          breakEnabledInperson: perfil.break_enabled_inperson,
        }
      : {
          durationOnline: 50,
          durationInperson: 50,
          breakOnline: 0,
          breakInperson: 0,
          breakEnabledOnline: false,
          breakEnabledInperson: false,
        },
    vacationMode: filaAjustes?.vacation_mode ?? false,
    timezone: filaAjustes?.timezone || "America/Argentina/Buenos_Aires",
    slots: (slots.data ?? []).map((s) => ({
      modality: s.modality as Modalidad,
      dayOfWeek: s.day_of_week as number,
      startTime: s.start_time as string,
    })),
    periodos: (periodos.data ?? []).map((p) => ({
      id: p.id as string,
      startDate: p.start_date as string,
      endDate: p.end_date as string,
      note: (p.note as string | null) ?? null,
    })),
  };
}

export async function guardarConfigSesiones(config: ConfigSesiones): Promise<ResultadoConfig> {
  const errorValidacion = validarConfig(config);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const anterior = await leerPerfil(supabase);
  if (!anterior) return { ok: false, error: "No se encontró tu perfil profesional." };

  const { error } = await supabase
    .from("professional_profile")
    .update({
      session_duration_online: config.durationOnline,
      session_duration_inperson: config.durationInperson,
      break_between_sessions_online: config.breakOnline,
      break_between_sessions_inperson: config.breakInperson,
      break_enabled_online: config.breakEnabledOnline,
      break_enabled_inperson: config.breakEnabledInperson,
    })
    .eq("is_active", true);

  if (error) return { ok: false, error: "No se pudo guardar la configuración." };

  const avisos: string[] = [];
  const cambioOnline =
    anterior.session_duration_online !== config.durationOnline ||
    anterior.break_between_sessions_online !== config.breakOnline ||
    anterior.break_enabled_online !== config.breakEnabledOnline;
  const cambioPresencial =
    anterior.session_duration_inperson !== config.durationInperson ||
    anterior.break_between_sessions_inperson !== config.breakInperson ||
    anterior.break_enabled_inperson !== config.breakEnabledInperson;

  if (cambioOnline) {
    avisos.push("Ha cambiado la duración o el descanso de las citas online: revisa y vuelve a guardar tus huecos de disponibilidad online.");
  }
  if (cambioPresencial) {
    avisos.push("Ha cambiado la duración o el descanso de las citas presenciales: revisa y vuelve a guardar tus huecos de disponibilidad presencial.");
  }

  return { ok: true, avisos };
}

function pasoDeModalidad(config: ConfigSesiones, modality: Modalidad): { duracion: number; paso: number } {
  if (modality === "online") {
    const duracion = config.durationOnline;
    return { duracion, paso: duracion + (config.breakEnabledOnline ? config.breakOnline : 0) };
  }
  const duracion = config.durationInperson;
  return { duracion, paso: duracion + (config.breakEnabledInperson ? config.breakInperson : 0) };
}

export async function guardarHuecos(modality: Modalidad, marcas: MarcaHueco[]): Promise<Resultado> {
  if (modality !== "online" && modality !== "inperson") {
    return { ok: false, error: "Modalidad no válida." };
  }

  const supabase = await createServerClient();
  const perfil = await leerPerfil(supabase);
  if (!perfil) return { ok: false, error: "No se encontró tu perfil profesional." };

  const { duracion, paso } = pasoDeModalidad(
    {
      durationOnline: perfil.session_duration_online,
      durationInperson: perfil.session_duration_inperson,
      breakOnline: perfil.break_between_sessions_online,
      breakInperson: perfil.break_between_sessions_inperson,
      breakEnabledOnline: perfil.break_enabled_online,
      breakEnabledInperson: perfil.break_enabled_inperson,
    },
    modality,
  );

  const vistas = new Set<string>();
  const filas: { modality: Modalidad; day_of_week: number; start_time: string; end_time: string }[] = [];

  for (const m of marcas) {
    if (!Number.isInteger(m.dayOfWeek) || m.dayOfWeek < 0 || m.dayOfWeek > 6) {
      return { ok: false, error: "Día de la semana no válido." };
    }
    if (!/^\d{2}:\d{2}:\d{2}$/.test(m.startTime)) {
      return { ok: false, error: "Hora de inicio no válida." };
    }
    const clave = `${m.dayOfWeek}-${m.startTime}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);

    const minutos = textoAMinutos(m.startTime);
    if (minutos + paso > 24 * 60) {
      return { ok: false, error: `El hueco de las ${m.startTime.slice(0, 5)} excede las 24:00.` };
    }

    filas.push({
      modality,
      day_of_week: m.dayOfWeek,
      start_time: m.startTime,
      end_time: `${minutosATexto(minutos + paso)}:00`,
    });
  }

  const { error: errorBorrar } = await supabase.from("availability_slots").delete().eq("modality", modality);
  if (errorBorrar) return { ok: false, error: "No se pudo guardar el horario." };

  if (filas.length > 0) {
    const { error: errorInsertar } = await supabase.from("availability_slots").insert(filas);
    if (errorInsertar) return { ok: false, error: "No se pudo guardar el horario." };
  }

  return { ok: true };
}

export async function setModoVacaciones(activo: boolean): Promise<Resultado> {
  const supabase = await createServerClient();
  const { error } = await supabase.from("site_settings").update({ vacation_mode: activo }).eq("id", true);
  if (error) return { ok: false, error: "No se pudo cambiar el modo vacaciones." };
  return { ok: true };
}

export async function crearPeriodoVacaciones(input: {
  startDate: string;
  endDate: string;
  note?: string;
}): Promise<ResultadoPeriodo> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) {
    return { ok: false, error: "Las fechas no son válidas." };
  }
  if (input.endDate < input.startDate) {
    return { ok: false, error: "La fecha de fin debe ser igual o posterior a la de inicio." };
  }
  if (input.note && input.note.length > 200) {
    return { ok: false, error: "La nota es demasiado larga (máximo 200 caracteres)." };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("vacation_periods")
    .insert({
      start_date: input.startDate,
      end_date: input.endDate,
      note: input.note?.trim() || null,
    })
    .select("id, start_date, end_date, note")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo añadir el periodo." };

  return {
    ok: true,
    periodo: {
      id: data.id as string,
      startDate: data.start_date as string,
      endDate: data.end_date as string,
      note: (data.note as string | null) ?? null,
    },
  };
}

export async function borrarPeriodoVacaciones(id: string): Promise<Resultado> {
  if (!id) return { ok: false, error: "Periodo no válido." };
  const supabase = await createServerClient();
  const { error } = await supabase.from("vacation_periods").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo borrar el periodo." };
  return { ok: true };
}
