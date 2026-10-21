// src/actions/politica-privacidad.ts
// Server Action de la política de privacidad (sesión verificada en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import { guardarPoliticaPrivacidad } from "@/services/politica-privacidad";
import { revalidarWebPublica } from "@/lib/revalidar-web";

export async function guardarPoliticaPrivacidadAction(
  contentHtml: string
): Promise<{ ok: boolean; error?: string; politica?: { version: string; updatedAt: string | null } }> {
  await exigirSesion();
  if (typeof contentHtml !== "string") {
    return { ok: false, error: "Datos no válidos." };
  }

  const res = await guardarPoliticaPrivacidad(contentHtml);
  if (!res.ok || !res.politica) return { ok: false, error: res.error };

  revalidarWebPublica();
  return { ok: true, politica: { version: res.politica.version, updatedAt: res.politica.updatedAt } };
}
