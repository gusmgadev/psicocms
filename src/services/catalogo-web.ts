// src/services/catalogo-web.ts
// Catálogo público de la web: servicios, especialidades y planes.
// Servicios y especialidades comparten forma (nombre, descripción, orden, visibilidad);
// los planes añaden precios online/presencial y características.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidarWebPublica } from "@/lib/revalidar-web";

export type TipoCatalogo = "servicios" | "especialidades";

const TABLAS: Record<TipoCatalogo, string> = {
  servicios: "services",
  especialidades: "specialties",
};

const ETIQUETAS: Record<TipoCatalogo, string> = {
  servicios: "servicio",
  especialidades: "especialidad",
};

export interface ItemCatalogo {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string | null;
  orden: number;
  activo: boolean;
}

export interface InputItemCatalogo {
  nombre: string;
  descripcion: string;
  icono?: string;
  activo?: boolean;
}

export interface ResultadoItem {
  ok: boolean;
  error?: string;
  item?: ItemCatalogo;
}

export interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precioOnline: number | null;
  precioInperson: number | null;
  caracteristicas: string[];
  orden: number;
  activo: boolean;
}

export interface InputPlan {
  nombre: string;
  descripcion: string;
  precioOnline?: number | null;
  precioInperson?: number | null;
  caracteristicas?: string[];
  activo?: boolean;
}

export interface ResultadoPlan {
  ok: boolean;
  error?: string;
  plan?: Plan;
}

const LIMITE_NOMBRE = 120;
const LIMITE_DESCRIPCION = 600;
const LIMITE_ICONO = 80;
const LIMITE_CARACTERISTICA = 120;
const MAXIMO_CARACTERISTICAS = 15;
const MAXIMO_PRECIO = 99_999.99;

interface FilaItem {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  is_active: boolean;
}

interface FilaPlan {
  id: string;
  name: string;
  description: string | null;
  price_online: string | number | null;
  price_inperson: string | number | null;
  features: unknown;
  order_index: number;
  is_active: boolean;
}

const SELECT_ITEM = "id, name, description, icon, order_index, is_active";
const SELECT_PLAN = "id, name, description, price_online, price_inperson, features, order_index, is_active";

function aItem(f: FilaItem): ItemCatalogo {
  return {
    id: f.id,
    nombre: f.name ?? "",
    descripcion: f.description ?? "",
    icono: f.icon || null,
    orden: f.order_index,
    activo: f.is_active,
  };
}

function aPlan(f: FilaPlan): Plan {
  const features = Array.isArray(f.features) ? f.features : [];
  return {
    id: f.id,
    nombre: f.name ?? "",
    descripcion: f.description ?? "",
    precioOnline: f.price_online === null ? null : Number(f.price_online),
    precioInperson: f.price_inperson === null ? null : Number(f.price_inperson),
    caracteristicas: features.filter((x): x is string => typeof x === "string"),
    orden: f.order_index,
    activo: f.is_active,
  };
}

function validarIcono(icono: string | undefined): string | null {
  const valor = (icono ?? "").trim();
  if (!valor) return null;
  if (valor.length > LIMITE_ICONO) return "El icono es demasiado largo.";
  if (!/^fa(-[a-z0-9]+)+(\s+fa(-[a-z0-9]+)+)*$/i.test(valor)) {
    return "Usa clases de Font Awesome, por ejemplo: fa-heart o fa-solid fa-heart.";
  }
  return null;
}

function validarItem(tipo: TipoCatalogo, input: InputItemCatalogo): string | null {
  const etiqueta = ETIQUETAS[tipo];
  const nombre = input.nombre?.trim() ?? "";
  if (nombre.length < 2 || nombre.length > LIMITE_NOMBRE) {
    return `El nombre del ${etiqueta} debe tener entre 2 y ${LIMITE_NOMBRE} caracteres.`;
  }
  if ((input.descripcion ?? "").length > LIMITE_DESCRIPCION) {
    return `La descripción no puede superar ${LIMITE_DESCRIPCION} caracteres.`;
  }
  if (tipo === "servicios") return validarIcono(input.icono);
  return null;
}

function validarPrecio(valor: number | null | undefined, etiqueta: string): string | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    return `El precio ${etiqueta} no es válido.`;
  }
  if (valor < 0 || valor > MAXIMO_PRECIO) {
    return `El precio ${etiqueta} debe estar entre 0 y ${MAXIMO_PRECIO} euros.`;
  }
  return null;
}

function validarPlan(input: InputPlan): string | null {
  const nombre = input.nombre?.trim() ?? "";
  if (nombre.length < 2 || nombre.length > LIMITE_NOMBRE) {
    return `El nombre del plan debe tener entre 2 y ${LIMITE_NOMBRE} caracteres.`;
  }
  if ((input.descripcion ?? "").length > LIMITE_DESCRIPCION) {
    return `La descripción no puede superar ${LIMITE_DESCRIPCION} caracteres.`;
  }
  const errorOnline = validarPrecio(input.precioOnline, "online");
  if (errorOnline) return errorOnline;
  const errorPresencial = validarPrecio(input.precioInperson, "presencial");
  if (errorPresencial) return errorPresencial;

  const caracteristicas = (input.caracteristicas ?? []).map((c) => (c ?? "").trim()).filter(Boolean);
  if (caracteristicas.length > MAXIMO_CARACTERISTICAS) {
    return `Un plan puede tener como máximo ${MAXIMO_CARACTERISTICAS} características.`;
  }
  if (caracteristicas.some((c) => c.length > LIMITE_CARACTERISTICA)) {
    return `Cada característica no puede superar ${LIMITE_CARACTERISTICA} caracteres.`;
  }
  return null;
}

export async function listarItems(tipo: TipoCatalogo): Promise<ItemCatalogo[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from(TABLAS[tipo])
    .select(SELECT_ITEM)
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });
  return ((data ?? []) as unknown as FilaItem[]).map(aItem);
}

export async function crearItem(tipo: TipoCatalogo, input: InputItemCatalogo): Promise<ResultadoItem> {
  const errorValidacion = validarItem(tipo, input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: ultima } = await supabase
    .from(TABLAS[tipo])
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orden = ((ultima as { order_index?: number } | null)?.order_index ?? 0) + 1;
  const { data, error } = await supabase
    .from(TABLAS[tipo])
    .insert({
      name: input.nombre.trim(),
      description: input.descripcion?.trim() || null,
      icon: tipo === "servicios" ? (input.icono?.trim().toLowerCase() || null) : null,
      order_index: orden,
      is_active: input.activo ?? true,
    })
    .select(SELECT_ITEM)
    .single();

  if (error || !data) return { ok: false, error: `No se pudo crear el ${ETIQUETAS[tipo]}.` };

  revalidarWebPublica();
  return { ok: true, item: aItem(data as unknown as FilaItem) };
}

export async function editarItem(
  tipo: TipoCatalogo,
  id: string,
  input: InputItemCatalogo,
): Promise<ResultadoItem> {
  if (!id) return { ok: false, error: "Elemento no válido." };
  const errorValidacion = validarItem(tipo, input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: previa } = await supabase.from(TABLAS[tipo]).select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "El elemento ya no existe." };

  const { data, error } = await supabase
    .from(TABLAS[tipo])
    .update({
      name: input.nombre.trim(),
      description: input.descripcion?.trim() || null,
      icon: tipo === "servicios" ? (input.icono?.trim().toLowerCase() || null) : null,
      is_active: input.activo ?? true,
    })
    .eq("id", id)
    .select(SELECT_ITEM)
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  revalidarWebPublica();
  return { ok: true, item: aItem(data as unknown as FilaItem) };
}

export async function eliminarItem(
  tipo: TipoCatalogo,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Elemento no válido." };
  const supabase = await createServerClient();

  const { data: previa } = await supabase.from(TABLAS[tipo]).select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "El elemento ya no existe." };

  const { error } = await supabase.from(TABLAS[tipo]).delete().eq("id", id);
  if (error) return { ok: false, error: `No se pudo eliminar el ${ETIQUETAS[tipo]}.` };

  revalidarWebPublica();
  return { ok: true };
}

export async function moverItem(
  tipo: TipoCatalogo,
  id: string,
  direccion: "arriba" | "abajo",
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Elemento no válido." };
  const supabase = await createServerClient();

  const { data: lista } = await supabase
    .from(TABLAS[tipo])
    .select("id, order_index, name")
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });

  const filas = (lista ?? []) as unknown as { id: string; order_index: number; name: string }[];
  const i = filas.findIndex((f) => f.id === id);
  if (i === -1) return { ok: false, error: "El elemento ya no existe." };

  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (j < 0 || j >= filas.length) return { ok: true };

  const [a, b] = await Promise.all([
    supabase.from(TABLAS[tipo]).update({ order_index: j + 1 }).eq("id", filas[i].id),
    supabase.from(TABLAS[tipo]).update({ order_index: i + 1 }).eq("id", filas[j].id),
  ]);
  if (a.error || b.error) return { ok: false, error: "No se pudo cambiar el orden." };

  revalidarWebPublica();
  return { ok: true };
}

export async function listarPlanes(): Promise<Plan[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("plans")
    .select(SELECT_PLAN)
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });
  return ((data ?? []) as unknown as FilaPlan[]).map(aPlan);
}

export async function crearPlan(input: InputPlan): Promise<ResultadoPlan> {
  const errorValidacion = validarPlan(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: ultima } = await supabase
    .from("plans")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orden = ((ultima as { order_index?: number } | null)?.order_index ?? 0) + 1;
  const { data, error } = await supabase
    .from("plans")
    .insert({
      name: input.nombre.trim(),
      description: input.descripcion?.trim() || null,
      price_online: input.precioOnline ?? null,
      price_inperson: input.precioInperson ?? null,
      features: (input.caracteristicas ?? []).map((c) => (c ?? "").trim()).filter(Boolean),
      order_index: orden,
      is_active: input.activo ?? true,
    })
    .select(SELECT_PLAN)
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear el plan." };

  revalidarWebPublica();
  return { ok: true, plan: aPlan(data as unknown as FilaPlan) };
}

export async function editarPlan(id: string, input: InputPlan): Promise<ResultadoPlan> {
  if (!id) return { ok: false, error: "Plan no válido." };
  const errorValidacion = validarPlan(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: previa } = await supabase.from("plans").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "El plan ya no existe." };

  const { data, error } = await supabase
    .from("plans")
    .update({
      name: input.nombre.trim(),
      description: input.descripcion?.trim() || null,
      price_online: input.precioOnline ?? null,
      price_inperson: input.precioInperson ?? null,
      features: (input.caracteristicas ?? []).map((c) => (c ?? "").trim()).filter(Boolean),
      is_active: input.activo ?? true,
    })
    .eq("id", id)
    .select(SELECT_PLAN)
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  revalidarWebPublica();
  return { ok: true, plan: aPlan(data as unknown as FilaPlan) };
}

export async function eliminarPlan(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Plan no válido." };
  const supabase = await createServerClient();

  const { data: previa } = await supabase.from("plans").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "El plan ya no existe." };

  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el plan." };

  revalidarWebPublica();
  return { ok: true };
}

export async function moverPlan(
  id: string,
  direccion: "arriba" | "abajo",
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Plan no válido." };
  const supabase = await createServerClient();

  const { data: lista } = await supabase
    .from("plans")
    .select("id, order_index, name")
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });

  const filas = (lista ?? []) as unknown as { id: string; order_index: number; name: string }[];
  const i = filas.findIndex((f) => f.id === id);
  if (i === -1) return { ok: false, error: "El plan ya no existe." };

  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (j < 0 || j >= filas.length) return { ok: true };

  const [a, b] = await Promise.all([
    supabase.from("plans").update({ order_index: j + 1 }).eq("id", filas[i].id),
    supabase.from("plans").update({ order_index: i + 1 }).eq("id", filas[j].id),
  ]);
  if (a.error || b.error) return { ok: false, error: "No se pudo cambiar el orden." };

  revalidarWebPublica();
  return { ok: true };
}
