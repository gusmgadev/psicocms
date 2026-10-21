// src/actions/catalogo-web.ts
// Server Actions del catálogo público (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  listarItems,
  crearItem,
  editarItem,
  eliminarItem,
  moverItem,
  listarPlanes,
  crearPlan,
  editarPlan,
  eliminarPlan,
  moverPlan,
  type TipoCatalogo,
  type InputItemCatalogo,
  type InputPlan,
  type ResultadoItem,
  type ResultadoPlan,
} from "@/services/catalogo-web";

function esTipoCatalogo(tipo: unknown): tipo is TipoCatalogo {
  return tipo === "servicios" || tipo === "especialidades";
}

export async function listarCatalogoAction(tipo: TipoCatalogo): Promise<Awaited<ReturnType<typeof listarItems>>> {
  await exigirSesion();
  if (!esTipoCatalogo(tipo)) return [];
  return listarItems(tipo);
}

export async function crearItemAction(tipo: TipoCatalogo, input: InputItemCatalogo): Promise<ResultadoItem> {
  await exigirSesion();
  if (!esTipoCatalogo(tipo) || !input || typeof input !== "object") {
    return { ok: false, error: "Datos no válidos." };
  }
  return crearItem(tipo, input);
}

export async function editarItemAction(
  tipo: TipoCatalogo,
  id: string,
  input: InputItemCatalogo,
): Promise<ResultadoItem> {
  await exigirSesion();
  if (!esTipoCatalogo(tipo) || !id || !input || typeof input !== "object") {
    return { ok: false, error: "Datos no válidos." };
  }
  return editarItem(tipo, id, input);
}

export async function eliminarItemAction(
  tipo: TipoCatalogo,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!esTipoCatalogo(tipo) || !id) return { ok: false, error: "Datos no válidos." };
  return eliminarItem(tipo, id);
}

export async function moverItemAction(
  tipo: TipoCatalogo,
  id: string,
  direccion: "arriba" | "abajo",
): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!esTipoCatalogo(tipo) || !id || (direccion !== "arriba" && direccion !== "abajo")) {
    return { ok: false, error: "Datos no válidos." };
  }
  return moverItem(tipo, id, direccion);
}

export async function listarPlanesAction(): Promise<Awaited<ReturnType<typeof listarPlanes>>> {
  await exigirSesion();
  return listarPlanes();
}

export async function crearPlanAction(input: InputPlan): Promise<ResultadoPlan> {
  await exigirSesion();
  if (!input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return crearPlan(input);
}

export async function editarPlanAction(id: string, input: InputPlan): Promise<ResultadoPlan> {
  await exigirSesion();
  if (!id || !input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return editarPlan(id, input);
}

export async function eliminarPlanAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!id) return { ok: false, error: "Datos no válidos." };
  return eliminarPlan(id);
}

export async function moverPlanAction(
  id: string,
  direccion: "arriba" | "abajo",
): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!id || (direccion !== "arriba" && direccion !== "abajo")) {
    return { ok: false, error: "Datos no válidos." };
  }
  return moverPlan(id, direccion);
}
