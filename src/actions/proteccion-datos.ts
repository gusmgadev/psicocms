// src/actions/proteccion-datos.ts
// Server Actions de protección de datos (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import { guardarPlantillaProteccion } from "@/services/proteccion-datos";

export async function guardarPlantillaProteccionAction(
  contentHtml: string,
): Promise<{ ok: boolean; error?: string; plantilla?: Awaited<ReturnType<typeof guardarPlantillaProteccion>>["plantilla"] }> {
  await exigirSesion();
  if (typeof contentHtml !== "string") return { ok: false, error: "Datos no válidos." };
  return guardarPlantillaProteccion(contentHtml);
}
