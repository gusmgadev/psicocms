// src/actions/faqs.ts
// Server Actions de preguntas frecuentes (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  listarFaqs,
  crearFaq,
  editarFaq,
  eliminarFaq,
  moverFaq,
  type InputFaq,
  type ResultadoFaq,
} from "@/services/faqs";

export async function listarFaqsAction(): Promise<Awaited<ReturnType<typeof listarFaqs>>> {
  await exigirSesion();
  return listarFaqs();
}

export async function crearFaqAction(input: InputFaq): Promise<ResultadoFaq> {
  await exigirSesion();
  if (!input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return crearFaq(input);
}

export async function editarFaqAction(id: string, input: InputFaq): Promise<ResultadoFaq> {
  await exigirSesion();
  if (!id || !input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return editarFaq(id, input);
}

export async function eliminarFaqAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!id) return { ok: false, error: "Datos no válidos." };
  return eliminarFaq(id);
}

export async function moverFaqAction(
  id: string,
  direccion: "arriba" | "abajo",
): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!id || (direccion !== "arriba" && direccion !== "abajo")) {
    return { ok: false, error: "Datos no válidos." };
  }
  return moverFaq(id, direccion);
}
