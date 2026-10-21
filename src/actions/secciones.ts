// src/actions/secciones.ts
// Server Action de las secciones activas de la web (verifican sesión
// en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import { guardarSecciones, type ResultadoSecciones } from "@/services/secciones";
import type { SeccionesWeb } from "@/lib/panel-tema";

export async function guardarSeccionesAction(secciones: SeccionesWeb): Promise<ResultadoSecciones> {
  await exigirSesion();
  if (typeof secciones !== "object" || secciones === null || Array.isArray(secciones)) {
    return { ok: false, error: "Datos no válidos." };
  }
  return guardarSecciones(secciones);
}
