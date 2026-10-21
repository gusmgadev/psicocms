// src/services/faqs.ts
// Preguntas frecuentes: CRUD con orden e interruptor de visibilidad.
// El HTML de la respuesta se sanea con DOMPurify al guardar y al servir.

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sanitizarHtml } from "@/lib/sanitizar";

export interface FaqFila {
  id: string;
  question: string;
  answerHtml: string;
  category: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InputFaq {
  question: string;
  answerHtml: string;
  category?: string;
  isActive?: boolean;
}

export interface ResultadoFaq {
  ok: boolean;
  error?: string;
  faq?: FaqFila;
}

const LIMITE_PREGUNTA = 300;
const LIMITE_CATEGORIA = 80;
const LIMITE_RESPUESTA = 50_000;

interface FilaFaq {
  id: string;
  question: string;
  answer_html: string;
  category: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function aFaqFila(f: FilaFaq): FaqFila {
  return {
    id: f.id,
    question: f.question,
    answerHtml: sanitizarHtml(f.answer_html ?? ""),
    category: f.category,
    orderIndex: f.order_index,
    isActive: f.is_active,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  };
}

function revalidarFaqsPublicas(): void {
  revalidatePath("/faq");
}

function validarInput(input: InputFaq): string | null {
  const pregunta = input.question?.trim() ?? "";
  if (pregunta.length < 3 || pregunta.length > LIMITE_PREGUNTA) {
    return `La pregunta debe tener entre 3 y ${LIMITE_PREGUNTA} caracteres.`;
  }
  if (!sanitizarHtml(input.answerHtml ?? "").trim()) {
    return "La respuesta no puede estar vacía.";
  }
  if ((input.answerHtml ?? "").length > LIMITE_RESPUESTA) {
    return `La respuesta no puede superar ${LIMITE_RESPUESTA} caracteres.`;
  }
  if (input.category && input.category.trim().length > LIMITE_CATEGORIA) {
    return `La categoría no puede superar ${LIMITE_CATEGORIA} caracteres.`;
  }
  return null;
}

export async function listarFaqs(): Promise<FaqFila[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("faqs")
    .select("id, question, answer_html, category, order_index, is_active, created_at, updated_at")
    .order("order_index", { ascending: true })
    .order("question", { ascending: true });
  return ((data ?? []) as unknown as FilaFaq[]).map(aFaqFila);
}

export async function crearFaq(input: InputFaq): Promise<ResultadoFaq> {
  const errorValidacion = validarInput(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: ultima } = await supabase
    .from("faqs")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orden = ((ultima as { order_index?: number } | null)?.order_index ?? 0) + 1;
  const { data, error } = await supabase
    .from("faqs")
    .insert({
      question: input.question.trim(),
      answer_html: sanitizarHtml(input.answerHtml),
      category: input.category?.trim() || null,
      order_index: orden,
      is_active: input.isActive ?? true,
    })
    .select("id, question, answer_html, category, order_index, is_active, created_at, updated_at")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo crear la pregunta." };

  revalidarFaqsPublicas();
  return { ok: true, faq: aFaqFila(data as unknown as FilaFaq) };
}

export async function editarFaq(id: string, input: InputFaq): Promise<ResultadoFaq> {
  if (!id) return { ok: false, error: "Pregunta no válida." };
  const errorValidacion = validarInput(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: previa } = await supabase.from("faqs").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "La pregunta ya no existe." };

  const { data, error } = await supabase
    .from("faqs")
    .update({
      question: input.question.trim(),
      answer_html: sanitizarHtml(input.answerHtml),
      category: input.category?.trim() || null,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)
    .select("id, question, answer_html, category, order_index, is_active, created_at, updated_at")
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  revalidarFaqsPublicas();
  return { ok: true, faq: aFaqFila(data as unknown as FilaFaq) };
}

export async function eliminarFaq(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Pregunta no válida." };
  const supabase = await createServerClient();

  const { data: previa } = await supabase.from("faqs").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "La pregunta ya no existe." };

  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la pregunta." };

  revalidarFaqsPublicas();
  return { ok: true };
}

export async function moverFaq(
  id: string,
  direccion: "arriba" | "abajo",
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Pregunta no válida." };
  const supabase = await createServerClient();

  const { data: lista } = await supabase
    .from("faqs")
    .select("id, order_index, question")
    .order("order_index", { ascending: true })
    .order("question", { ascending: true });

  const filas = (lista ?? []) as unknown as { id: string; order_index: number; question: string }[];
  const i = filas.findIndex((f) => f.id === id);
  if (i === -1) return { ok: false, error: "La pregunta ya no existe." };

  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (j < 0 || j >= filas.length) return { ok: true };

  const [a, b] = await Promise.all([
    supabase.from("faqs").update({ order_index: j + 1 }).eq("id", filas[i].id),
    supabase.from("faqs").update({ order_index: i + 1 }).eq("id", filas[j].id),
  ]);
  if (a.error || b.error) return { ok: false, error: "No se pudo cambiar el orden." };

  revalidarFaqsPublicas();
  return { ok: true };
}
