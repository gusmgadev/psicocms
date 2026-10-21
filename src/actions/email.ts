// src/actions/email.ts
// Server Actions de la configuración de email (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  enviarEmailPrueba,
  guardarConfigEmail,
  type ConfigEmail,
  type InputConfigEmail,
  type ResultadoEmail,
} from "@/services/email";

export async function guardarConfigEmailAction(
  input: InputConfigEmail
): Promise<ResultadoEmail & { config?: ConfigEmail }> {
  await exigirSesion();
  return guardarConfigEmail(input);
}

export async function enviarEmailPruebaAction(): Promise<ResultadoEmail> {
  await exigirSesion();
  return enviarEmailPrueba();
}
