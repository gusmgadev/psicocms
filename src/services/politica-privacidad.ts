// src/services/politica-privacidad.ts
// Política de privacidad pública editable y versionada (una sola fila).
// El HTML se sanea con DOMPurify antes de guardarlo y de mostrarlo.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sanitizarHtml } from "@/lib/sanitizar";

export interface PoliticaPrivacidad {
  contentHtml: string;
  version: string;
  updatedAt: string | null;
}

const LIMITE_CONTENIDO = 100_000;

interface FilaPolitica {
  content_html: string;
  version: string;
  updated_at: string | null;
}

function aPolitica(f: FilaPolitica): PoliticaPrivacidad {
  return {
    contentHtml: sanitizarHtml(f.content_html ?? ""),
    version: f.version ?? "1.0",
    updatedAt: f.updated_at,
  };
}

export async function obtenerPoliticaPrivacidad(): Promise<PoliticaPrivacidad> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("privacy_policy")
    .select("content_html, version, updated_at")
    .eq("id", true)
    .maybeSingle();

  if (!data) return { contentHtml: "", version: "1.0", updatedAt: null };
  return aPolitica(data as unknown as FilaPolitica);
}

function siguienteVersion(actual: string): string {
  const m = /^(\d+)\.(\d+)$/.exec((actual ?? "").trim());
  if (!m) return "1.0";
  return `${Number(m[1])}.${Number(m[2]) + 1}`;
}

export async function guardarPoliticaPrivacidad(
  contentHtml: string
): Promise<{ ok: boolean; error?: string; politica?: PoliticaPrivacidad }> {
  const html = sanitizarHtml(contentHtml ?? "");
  if (!html.trim()) {
    return { ok: false, error: "El contenido de la política no puede estar vacío." };
  }
  if (html.length > LIMITE_CONTENIDO) {
    return { ok: false, error: "El contenido es demasiado largo." };
  }

  const supabase = await createServerClient();
  const { data: previa } = await supabase
    .from("privacy_policy")
    .select("version")
    .eq("id", true)
    .maybeSingle();

  const version = siguienteVersion((previa as { version?: string } | null)?.version ?? "1.0");
  const { data, error } = await supabase
    .from("privacy_policy")
    .upsert({ id: true, content_html: html, version }, { onConflict: "id" })
    .select("content_html, version, updated_at")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo guardar la política." };
  return { ok: true, politica: aPolitica(data as unknown as FilaPolitica) };
}
