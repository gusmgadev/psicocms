// src/actions/frases.ts
// Server Actions de las frases públicas (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import { guardarFrases, type CambioFrase } from "@/services/frases";

export async function guardarFrasesAction(
  cambios: CambioFrase[]
): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return guardarFrases(cambios);
}
