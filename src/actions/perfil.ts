// src/actions/perfil.ts
// Server Actions del perfil privado de la psicóloga (verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  cambiarEmailAcceso,
  guardarPerfilPrivado,
  quitarAvatar,
  subirAvatar,
} from "@/services/perfil-privado";

export async function guardarPerfilPrivadoAction(
  nombre: string,
  telefonoPrivado: string
): Promise<{ ok: boolean; error?: string; perfil?: { nombre: string; telefonoPrivado: string; avatarUrl: string | null } }> {
  const { user } = await exigirSesion();
  if (typeof nombre !== "string" || typeof telefonoPrivado !== "string") {
    return { ok: false, error: "Datos no válidos." };
  }
  void user;
  return guardarPerfilPrivado(nombre, telefonoPrivado);
}

export async function subirAvatarAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; url?: string }> {
  await exigirSesion();
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File)) {
    return { ok: false, error: "No se ha seleccionado ningún archivo." };
  }
  return subirAvatar(archivo);
}

export async function quitarAvatarAction(): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  return quitarAvatar();
}

export async function cambiarEmailAccesoAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; email?: string }> {
  const { user } = await exigirSesion();
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    return { ok: false, error: "Datos no válidos." };
  }
  if (!password) {
    return { ok: false, error: "Introduce tu contraseña actual." };
  }
  return cambiarEmailAcceso(user, email, password);
}
