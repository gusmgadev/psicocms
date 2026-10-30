// src/actions/informacion-publica.ts
// Server Actions de información pública (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  obtenerInformacionParaPanel,
  guardarInformacionPublica,
  type InformacionPublica,
  type ResultadoInformacion,
} from "@/services/informacion-publica";

export async function obtenerInformacionPublicaAction(): Promise<InformacionPublica> {
  await exigirSesion();
  return obtenerInformacionParaPanel();
}

export async function guardarInformacionPublicaAction(
  input: InformacionPublica,
): Promise<ResultadoInformacion> {
  await exigirSesion();
  if (!input || typeof input !== "object") return { ok: false, error: "Datos no válidos." };
  return guardarInformacionPublica(input);
}
