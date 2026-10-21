// src/actions/preferencias.ts
// Server Action de las preferencias visuales del panel (verifican sesión
// en servidor). Al guardar también se escribe la cookie para aplicar el
// tema desde el servidor sin parpadeo.

"use server";

import { cookies } from "next/headers";
import { exigirSesion } from "@/lib/auth-guard";
import { guardarPreferencias, type ResultadoPreferencias } from "@/services/preferencias";
import { COOKIE_PREFERENCIAS } from "@/lib/panel-tema";

export async function guardarPreferenciasAction(
  modo: string,
  colorPrimario: string,
): Promise<ResultadoPreferencias> {
  const { user } = await exigirSesion();
  if (typeof modo !== "string" || typeof colorPrimario !== "string") {
    return { ok: false, error: "Datos no válidos." };
  }

  const resultado = await guardarPreferencias(user.id, modo, colorPrimario);
  if (!resultado.ok || !resultado.preferencias) {
    return resultado;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_PREFERENCIAS, JSON.stringify(resultado.preferencias), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return resultado;
}
