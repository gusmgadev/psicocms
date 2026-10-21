// src/actions/temas.ts
// Server Actions de temas visuales (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  obtenerConfigTema,
  guardarConfigTema,
  type ConfigTema,
  type ResultadoConfigTema,
} from "@/services/temas";

export async function obtenerConfigTemaAction(): Promise<ConfigTema> {
  await exigirSesion();
  return obtenerConfigTema();
}

export async function guardarConfigTemaAction(
  tema: string,
  modoLayout: string,
): Promise<ResultadoConfigTema> {
  await exigirSesion();
  if (typeof tema !== "string" || typeof modoLayout !== "string") {
    return { ok: false, error: "Datos no válidos." };
  }
  return guardarConfigTema(tema, modoLayout);
}
