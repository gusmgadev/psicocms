// src/services/proteccion-datos.ts
// Plantilla de política de protección de datos (una sola fila versionada)
// y datos del responsable para los PDF. El HTML se sanea con DOMPurify.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sanitizarHtml } from "@/lib/sanitizar";

export interface PlantillaProteccion {
  contentHtml: string;
  version: string;
  updatedAt: string | null;
}

export interface DatosResponsable {
  fullName: string;
  licenseNumber: string | null;
  address: string | null;
  phonePublic: string | null;
  emailPublic: string | null;
}

const LIMITE_CONTENIDO = 100_000;

interface FilaPlantilla {
  content_html: string;
  version: string;
  updated_at: string | null;
}

function aPlantilla(f: FilaPlantilla): PlantillaProteccion {
  return {
    contentHtml: sanitizarHtml(f.content_html ?? ""),
    version: f.version ?? "1.0",
    updatedAt: f.updated_at,
  };
}

export async function obtenerPlantillaProteccion(): Promise<PlantillaProteccion> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("data_protection_template")
    .select("content_html, version, updated_at")
    .eq("id", true)
    .maybeSingle();

  if (!data) return { contentHtml: "", version: "1.0", updatedAt: null };
  return aPlantilla(data as unknown as FilaPlantilla);
}

function siguienteVersion(actual: string): string {
  const m = /^(\d+)\.(\d+)$/.exec((actual ?? "").trim());
  if (!m) return "1.0";
  return `${Number(m[1])}.${Number(m[2]) + 1}`;
}

export async function guardarPlantillaProteccion(
  contentHtml: string,
): Promise<{ ok: boolean; error?: string; plantilla?: PlantillaProteccion }> {
  const html = sanitizarHtml(contentHtml ?? "");
  if (!html.trim()) {
    return { ok: false, error: "El contenido de la plantilla no puede estar vacío." };
  }
  if (html.length > LIMITE_CONTENIDO) {
    return { ok: false, error: "El contenido es demasiado largo." };
  }

  const supabase = await createServerClient();
  const { data: previa } = await supabase
    .from("data_protection_template")
    .select("version")
    .eq("id", true)
    .maybeSingle();

  const version = siguienteVersion((previa as { version?: string } | null)?.version ?? "1.0");
  const { data, error } = await supabase
    .from("data_protection_template")
    .upsert({ id: true, content_html: html, version }, { onConflict: "id" })
    .select("content_html, version, updated_at")
    .single();

  if (error || !data) return { ok: false, error: "No se pudo guardar la plantilla." };
  return { ok: true, plantilla: aPlantilla(data as unknown as FilaPlantilla) };
}

export async function obtenerDatosResponsable(): Promise<DatosResponsable | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("professional_profile")
    .select("full_name, license_number, address, phone_public, email_public")
    .maybeSingle();

  if (!data) return null;
  const f = data as {
    full_name: string;
    license_number: string | null;
    address: string | null;
    phone_public: string | null;
    email_public: string | null;
  };
  return {
    fullName: f.full_name,
    licenseNumber: f.license_number,
    address: f.address,
    phonePublic: f.phone_public,
    emailPublic: f.email_public,
  };
}
