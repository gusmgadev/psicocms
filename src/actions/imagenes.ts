// src/actions/imagenes.ts
// Server Actions de imágenes del sitio (todas verifican sesión en servidor).

"use server";

import { exigirSesion } from "@/lib/auth-guard";
import {
  listarImagenesSitio,
  subirImagenSitio,
  quitarImagenSitio,
  type ImagenSitio,
} from "@/services/imagenes";

export async function listarImagenesSitioAction(): Promise<ImagenSitio[]> {
  await exigirSesion();
  return listarImagenesSitio();
}

export async function subirImagenSitioAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  const placeholder = formData.get("placeholder");
  const archivo = formData.get("archivo");
  if (typeof placeholder !== "string" || !placeholder) return { ok: false, error: "Datos no válidos." };
  if (!(archivo instanceof File)) return { ok: false, error: "No se ha seleccionado ningún archivo." };
  return subirImagenSitio(placeholder, archivo);
}

export async function quitarImagenSitioAction(placeholder: string): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();
  if (!placeholder) return { ok: false, error: "Datos no válidos." };
  return quitarImagenSitio(placeholder);
}
