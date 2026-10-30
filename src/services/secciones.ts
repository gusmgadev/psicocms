// src/services/secciones.ts
// Secciones activas de la web pública (site_settings.sections_enabled).
// Se valida contra la lista blanca de src/lib/panel-tema.ts.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public-server";
import { revalidarWebPublica } from "@/lib/revalidar-web";
import { parsearSecciones, seccionActiva, type SeccionesWeb } from "@/lib/panel-tema";

export interface ResultadoSecciones {
  ok: boolean;
  error?: string;
  secciones?: SeccionesWeb;
}

export async function obtenerSecciones(): Promise<SeccionesWeb> {
  try {
    // Cliente anon: la web pública (y el panel al mostrar el estado) ven lo mismo
    // estés logueada o no.
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("site_settings")
      .select("sections_enabled")
      .eq("id", true)
      .maybeSingle();
    return parsearSecciones(data?.sections_enabled);
  } catch {
    return parsearSecciones(null);
  }
}

export async function guardarSecciones(secciones: SeccionesWeb): Promise<ResultadoSecciones> {
  const validadas = parsearSecciones(secciones);

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from("site_settings")
      .update({ sections_enabled: validadas })
      .eq("id", true);

    if (error) {
      return { ok: false, error: "No se pudieron guardar las secciones." };
    }

    revalidarWebPublica();
    return { ok: true, secciones: validadas };
  } catch {
    return { ok: false, error: "Algo salió mal. Inténtalo de nuevo en unos minutos." };
  }
}

export async function seccionActivaPublica(clave: string): Promise<boolean> {
  return seccionActiva(await obtenerSecciones(), clave);
}
