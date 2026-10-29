// src/services/temas.ts
// Configuración del tema visual de la web pública (site_settings).
// El tema activo se valida contra el índice de temas (src/themes/index.ts).

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidarWebPublica } from "@/lib/revalidar-web";
import { esModoLayoutValido, esTemaValido, type ModoLayout } from "@/themes";

export interface ConfigTema {
  temaActivo: string;
  modoLayout: ModoLayout;
}

export interface ResultadoConfigTema {
  ok: boolean;
  error?: string;
  config?: ConfigTema;
}

export async function obtenerConfigTema(): Promise<ConfigTema> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("site_settings")
      .select("active_theme, layout_mode")
      .eq("id", true)
      .maybeSingle();

    const tema = typeof data?.active_theme === "string" ? data.active_theme : "base";
    const modo = typeof data?.layout_mode === "string" ? data.layout_mode : "multipage";

    return {
      temaActivo: esTemaValido(tema) ? tema : "base",
      modoLayout: esModoLayoutValido(modo) ? modo : "multipage",
    };
  } catch {
    return { temaActivo: "base", modoLayout: "multipage" };
  }
}

export async function guardarConfigTema(
  tema: string,
  modoLayout: string,
): Promise<ResultadoConfigTema> {
  if (!esTemaValido(tema)) {
    return { ok: false, error: "El tema elegido no existe." };
  }
  if (!esModoLayoutValido(modoLayout)) {
    return { ok: false, error: "El modo de la web no es válido." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ active_theme: tema, layout_mode: modoLayout })
    .eq("id", true);

  if (error) {
    return { ok: false, error: "No se pudo guardar la configuración del tema." };
  }

  revalidarWebPublica();
  return { ok: true, config: { temaActivo: tema, modoLayout } };
}
