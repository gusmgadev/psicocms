// src/actions/redes.ts
// Server Actions de las redes sociales (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  alternarRed,
  crearRed,
  editarRed,
  eliminarRed,
  moverRed,
  type InputRed,
  type ResultadoRed,
} from "@/services/redes";

export async function crearRedAction(input: InputRed): Promise<ResultadoRed> {
  await exigirSesion();
  return crearRed(input);
}

export async function editarRedAction(id: string, input: InputRed): Promise<ResultadoRed> {
  await exigirSesion();
  return editarRed(id, input);
}

export async function eliminarRedAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return eliminarRed(id);
}

export async function alternarRedAction(id: string): Promise<{
  ok: boolean;
  error?: string;
  red?: ResultadoRed["red"];
}> {
  await exigirSesion();
  return alternarRed(id);
}

export async function moverRedAction(
  id: string,
  direccion: "arriba" | "abajo"
): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return moverRed(id, direccion);
}
