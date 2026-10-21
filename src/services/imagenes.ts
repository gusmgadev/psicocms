// src/services/imagenes.ts
// Imágenes estáticas de la web pública por hueco (site_images + bucket public-images).
// Si un hueco no tiene imagen personalizada, se usa la de stock (/images/stock/...).

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidarWebPublica } from "@/lib/revalidar-web";

export interface HuecoImagen {
  id: string;
  nombre: string;
  descripcion: string;
  stock: string;
}

export const HUECOS_IMAGEN: HuecoImagen[] = [
  {
    id: "hero",
    nombre: "Imagen principal",
    descripcion: "Foto grande de la portada y del inicio.",
    stock: "/images/stock/psicologa.jpg",
  },
  {
    id: "sobre-mi",
    nombre: "Sobre mí",
    descripcion: "Imagen de la sección sobre la psicóloga.",
    stock: "/images/stock/why.jpg",
  },
  {
    id: "servicios",
    nombre: "Servicios",
    descripcion: "Imagen de la sección de servicios.",
    stock: "/images/stock/servicio1.jpg",
  },
  {
    id: "especialidades",
    nombre: "Especialidades",
    descripcion: "Imagen de la sección de especialidades.",
    stock: "/images/stock/terapia1.jpg",
  },
  {
    id: "cita",
    nombre: "Pide cita",
    descripcion: "Imagen de la sección de reserva de citas.",
    stock: "/images/stock/terapia2.jpg",
  },
  {
    id: "contacto",
    nombre: "Contacto",
    descripcion: "Imagen de la sección de contacto.",
    stock: "/images/stock/psicologia.jpg",
  },
  {
    id: "blog",
    nombre: "Blog",
    descripcion: "Imagen de la cabecera del blog.",
    stock: "/images/stock/blog1.jpg",
  },
  {
    id: "faq",
    nombre: "Preguntas frecuentes",
    descripcion: "Imagen de la sección de preguntas frecuentes.",
    stock: "/images/stock/question1.jpg",
  },
];

export interface ImagenSitio extends HuecoImagen {
  personalizada: boolean;
  imagePath: string | null;
  url: string;
  alt: string;
}

interface FilaSiteImage {
  placeholder: string;
  image_path: string;
  alt_text: string | null;
}

function urlPublica(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/public-images/${path}`;
}

export async function listarImagenesSitio(): Promise<ImagenSitio[]> {
  const supabase = await createServerClient();
  const { data } = await supabase.from("site_images").select("placeholder, image_path, alt_text");
  const mapa = new Map<string, FilaSiteImage>(
    ((data ?? []) as unknown as FilaSiteImage[]).map((f) => [f.placeholder, f])
  );

  return HUECOS_IMAGEN.map((h) => {
    const fila = mapa.get(h.id);
    const personalizada = Boolean(fila?.image_path);
    return {
      ...h,
      personalizada,
      imagePath: fila?.image_path ?? null,
      url: personalizada ? urlPublica(fila!.image_path) : h.stock,
      alt: fila?.alt_text?.trim() || h.nombre,
    };
  });
}

// Helper para temas (FASE 16): URL de la imagen del hueco (personalizada o stock).
export async function obtenerImagenHueco(placeholder: string): Promise<string | null> {
  const hueco = HUECOS_IMAGEN.find((h) => h.id === placeholder);
  if (!hueco) return null;
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("site_images")
    .select("image_path")
    .eq("placeholder", placeholder)
    .maybeSingle();
  const path = (data as unknown as { image_path: string | null } | null)?.image_path;
  return path ? urlPublica(path) : hueco.stock;
}

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_IMAGEN = 5 * 1024 * 1024;

export async function subirImagenSitio(
  placeholder: string,
  archivo: File
): Promise<{ ok: boolean; error?: string }> {
  const hueco = HUECOS_IMAGEN.find((h) => h.id === placeholder);
  if (!hueco) return { ok: false, error: "Hueco de imagen no válido." };
  if (!archivo || archivo.size === 0) {
    return { ok: false, error: "No se ha seleccionado ningún archivo." };
  }
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    return { ok: false, error: "Solo se permiten imágenes JPG, PNG o WebP." };
  }
  if (archivo.size > LIMITE_IMAGEN) {
    return { ok: false, error: "La imagen no debe superar 5 MB." };
  }

  const supabase = await createServerClient();

  const { data: previa } = await supabase
    .from("site_images")
    .select("image_path")
    .eq("placeholder", placeholder)
    .maybeSingle();
  const pathPrevio = (previa as unknown as { image_path: string | null } | null)?.image_path ?? null;

  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "webp";
  const sufijo = extension === "jpeg" ? "jpg" : extension === "png" ? "png" : extension === "webp" ? "webp" : "webp";
  const path = `imagenes/${crypto.randomUUID()}.${sufijo}`;

  const { error: uploadError } = await supabase.storage
    .from("public-images")
    .upload(path, archivo, { contentType: archivo.type, upsert: false });
  if (uploadError) return { ok: false, error: "No se pudo subir la imagen." };

  const { error: dbError } = await supabase.from("site_images").upsert({
    placeholder,
    image_path: path,
    alt_text: hueco.nombre,
    updated_at: new Date().toISOString(),
  });
  if (dbError) {
    await supabase.storage.from("public-images").remove([path]);
    return { ok: false, error: "No se pudo guardar la imagen." };
  }

  if (pathPrevio && pathPrevio !== path) {
    await supabase.storage.from("public-images").remove([pathPrevio]);
  }

  revalidarWebPublica();
  return { ok: true };
}

export async function quitarImagenSitio(placeholder: string): Promise<{ ok: boolean; error?: string }> {
  const hueco = HUECOS_IMAGEN.find((h) => h.id === placeholder);
  if (!hueco) return { ok: false, error: "Hueco de imagen no válido." };

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("site_images")
    .select("image_path")
    .eq("placeholder", placeholder)
    .maybeSingle();
  const path = (data as unknown as { image_path: string | null } | null)?.image_path ?? null;

  const { error } = await supabase.from("site_images").delete().eq("placeholder", placeholder);
  if (error) return { ok: false, error: "No se pudo quitar la imagen." };

  if (path) {
    await supabase.storage.from("public-images").remove([path]);
  }

  revalidarWebPublica();
  return { ok: true };
}
