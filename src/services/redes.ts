// src/services/redes.ts
// Redes sociales enlazadas desde el pie de la web pública.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public-server";
import { revalidarWebPublica } from "@/lib/revalidar-web";
import { opcionRed, type InputRed, type RedSocial } from "@/lib/redes";

export type { InputRed, OpcionRed, RedSocial } from "@/lib/redes";
export { REDES_DISPONIBLES, opcionRed } from "@/lib/redes";

export interface ResultadoRed {
  ok: boolean;
  error?: string;
  red?: RedSocial;
}

const LIMITE_URL = 300;

interface FilaRed {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  order_index: number;
  is_active: boolean;
}

const SELECT = "id, platform, url, icon, order_index, is_active";

function aRed(f: FilaRed): RedSocial {
  return {
    id: f.id,
    platform: f.platform,
    url: f.url,
    icon: f.icon ?? "",
    orderIndex: f.order_index,
    isActive: f.is_active,
  };
}

function validar(input: InputRed): string | null {
  if (!opcionRed(input.platform)) {
    return "Elige una red social de la lista.";
  }
  const url = input.url?.trim() ?? "";
  if (!url) return "La dirección de la red social es obligatoria.";
  if (url.length > LIMITE_URL) {
    return `La dirección no puede superar ${LIMITE_URL} caracteres.`;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "La dirección no es válida. Empieza por https:// y pega el enlace completo.";
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return "La dirección debe empezar por https:// (o http://).";
  }
  return null;
}

export async function listarRedes(): Promise<RedSocial[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("social_links")
    .select(SELECT)
    .order("order_index", { ascending: true });
  return ((data ?? []) as unknown as FilaRed[]).map(aRed);
}

export async function listarRedesActivas(): Promise<RedSocial[]> {
  try {
    // Cliente anon: el footer público se lee igual estés logueada o no.
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("social_links")
      .select(SELECT)
      .eq("is_active", true)
      .order("order_index", { ascending: true });
    return ((data ?? []) as unknown as FilaRed[]).map(aRed);
  } catch {
    return [];
  }
}

export async function crearRed(input: InputRed): Promise<ResultadoRed> {
  const errorValidacion = validar(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: ultima } = await supabase
    .from("social_links")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orden = ((ultima as { order_index?: number } | null)?.order_index ?? 0) + 1;
  const opcion = opcionRed(input.platform)!;

  const { data, error } = await supabase
    .from("social_links")
    .insert({
      platform: input.platform,
      url: input.url.trim(),
      icon: opcion.icon,
      order_index: orden,
      is_active: input.isActive ?? true,
    })
    .select(SELECT)
    .single();

  if (error || !data) return { ok: false, error: "No se pudo añadir la red social." };

  revalidarWebPublica();
  return { ok: true, red: aRed(data as unknown as FilaRed) };
}

export async function editarRed(id: string, input: InputRed): Promise<ResultadoRed> {
  if (!id) return { ok: false, error: "Red social no válida." };
  const errorValidacion = validar(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: previa } = await supabase.from("social_links").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "La red social ya no existe." };

  const opcion = opcionRed(input.platform)!;
  const { data, error } = await supabase
    .from("social_links")
    .update({
      platform: input.platform,
      url: input.url.trim(),
      icon: opcion.icon,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error || !data) return { ok: false, error: "No se pudieron guardar los cambios." };

  revalidarWebPublica();
  return { ok: true, red: aRed(data as unknown as FilaRed) };
}

export async function eliminarRed(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Red social no válida." };
  const supabase = await createServerClient();

  const { data: previa } = await supabase.from("social_links").select("id").eq("id", id).maybeSingle();
  if (!previa) return { ok: false, error: "La red social ya no existe." };

  const { error } = await supabase.from("social_links").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar la red social." };

  revalidarWebPublica();
  return { ok: true };
}

export async function alternarRed(id: string): Promise<{ ok: boolean; error?: string; red?: RedSocial }> {
  if (!id) return { ok: false, error: "Red social no válida." };
  const supabase = await createServerClient();

  const { data: previa } = await supabase
    .from("social_links")
    .select("id, is_active")
    .eq("id", id)
    .maybeSingle();
  if (!previa) return { ok: false, error: "La red social ya no existe." };

  const { data, error } = await supabase
    .from("social_links")
    .update({ is_active: !(previa as { is_active: boolean }).is_active })
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error || !data) return { ok: false, error: "No se pudo cambiar el estado." };

  revalidarWebPublica();
  return { ok: true, red: aRed(data as unknown as FilaRed) };
}

export async function moverRed(
  id: string,
  direccion: "arriba" | "abajo"
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Red social no válida." };
  const supabase = await createServerClient();

  const { data: lista } = await supabase
    .from("social_links")
    .select("id, order_index")
    .order("order_index", { ascending: true });

  const filas = (lista ?? []) as unknown as { id: string; order_index: number }[];
  const i = filas.findIndex((f) => f.id === id);
  if (i === -1) return { ok: false, error: "La red social ya no existe." };

  const j = direccion === "arriba" ? i - 1 : i + 1;
  if (j < 0 || j >= filas.length) return { ok: true };

  const [a, b] = await Promise.all([
    supabase.from("social_links").update({ order_index: j + 1 }).eq("id", filas[i].id),
    supabase.from("social_links").update({ order_index: i + 1 }).eq("id", filas[j].id),
  ]);
  if (a.error || b.error) return { ok: false, error: "No se pudo cambiar el orden." };

  revalidarWebPublica();
  return { ok: true };
}
