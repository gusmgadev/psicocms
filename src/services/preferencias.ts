// src/services/preferencias.ts
// Preferencias visuales del panel (dashboard_preferences).
// Solo las lee y escribe el servidor; la cookie es el atajo para
// aplicarlas sin parpadeo al cargar.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  PREFERENCIAS_POR_DEFECTO,
  esColorPanel,
  esModoPanel,
  type PreferenciasPanel,
} from "@/lib/panel-tema";

export interface ResultadoPreferencias {
  ok: boolean;
  error?: string;
  preferencias?: PreferenciasPanel;
}

export async function obtenerPreferencias(): Promise<PreferenciasPanel> {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("dashboard_preferences")
      .select("theme_mode, primary_color")
      .maybeSingle();

    if (!esModoPanel(data?.theme_mode) || !esColorPanel(data?.primary_color)) {
      return PREFERENCIAS_POR_DEFECTO;
    }
    return { modo: data.theme_mode, colorPrimario: data.primary_color };
  } catch {
    return PREFERENCIAS_POR_DEFECTO;
  }
}

export async function guardarPreferencias(
  userId: string,
  modo: string,
  colorPrimario: string,
): Promise<ResultadoPreferencias> {
  if (!esModoPanel(modo) || !esColorPanel(colorPrimario)) {
    return { ok: false, error: "El tema elegido no es válido." };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from("dashboard_preferences")
      .upsert({ user_id: userId, theme_mode: modo, primary_color: colorPrimario });

    if (error) {
      return { ok: false, error: "No se pudo guardar el tema del panel." };
    }
    return { ok: true, preferencias: { modo, colorPrimario } };
  } catch {
    return { ok: false, error: "Algo salió mal. Inténtalo de nuevo en unos minutos." };
  }
}
