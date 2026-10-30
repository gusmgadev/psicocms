// src/services/informacion-publica.ts
// Datos públicos del perfil de la psicóloga (nombre, contacto, dirección, sobre mí).
// El "sobre mí" es HTML de editor wysiwyg: se sanea con DOMPurify al guardar y al servir.

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public-server";
import { sanitizarHtml } from "@/lib/sanitizar";
import { revalidarWebPublica } from "@/lib/revalidar-web";

export interface InformacionPublica {
  fullName: string;
  tagline: string;
  licenseNumber: string;
  phonePublic: string;
  emailPublic: string;
  bioHtml: string;
  address: string;
  locationName: string;
}

export interface ResultadoInformacion {
  ok: boolean;
  error?: string;
  datos?: InformacionPublica;
}

const LIMITE_NOMBRE = 150;
const LIMITE_ESLOGAN = 200;
const LIMITE_COLEGIADO = 50;
const LIMITE_TELEFONO = 30;
const LIMITE_EMAIL = 200;
const LIMITE_BIO = 100_000;
const LIMITE_DIRECCION = 250;
const LIMITE_LUGAR = 150;

const SELECT =
  "full_name, tagline, license_number, phone_public, email_public, bio, address, location_name";

interface FilaPerfil {
  full_name: string;
  tagline: string | null;
  license_number: string | null;
  phone_public: string | null;
  email_public: string | null;
  bio: string | null;
  address: string | null;
  location_name: string | null;
}

function aDatos(f: FilaPerfil): InformacionPublica {
  return {
    fullName: f.full_name ?? "",
    tagline: f.tagline ?? "",
    licenseNumber: f.license_number ?? "",
    phonePublic: f.phone_public ?? "",
    emailPublic: f.email_public ?? "",
    bioHtml: sanitizarHtml(f.bio ?? ""),
    address: f.address ?? "",
    locationName: f.location_name ?? "",
  };
}

function validar(input: InformacionPublica): string | null {
  const nombre = input.fullName?.trim() ?? "";
  if (nombre.length < 2 || nombre.length > LIMITE_NOMBRE) {
    return `El nombre debe tener entre 2 y ${LIMITE_NOMBRE} caracteres.`;
  }
  if ((input.tagline ?? "").length > LIMITE_ESLOGAN) {
    return `El eslogan no puede superar ${LIMITE_ESLOGAN} caracteres.`;
  }
  if ((input.licenseNumber ?? "").length > LIMITE_COLEGIADO) {
    return `El número de colegiado no puede superar ${LIMITE_COLEGIADO} caracteres.`;
  }

  const telefono = (input.phonePublic ?? "").trim();
  if (telefono.length > LIMITE_TELEFONO) {
    return `El teléfono no puede superar ${LIMITE_TELEFONO} caracteres.`;
  }
  if (telefono && !/^[+0-9\s().-]+$/.test(telefono)) {
    return "El teléfono solo puede contener números, espacios y los símbolos + ( ) - .";
  }

  const email = (input.emailPublic ?? "").trim();
  if (email.length > LIMITE_EMAIL) {
    return `El email no puede superar ${LIMITE_EMAIL} caracteres.`;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "El email no tiene un formato válido.";
  }

  if (!sanitizarHtml(input.bioHtml ?? "").trim()) {
    return "El texto «Sobre mí» no puede estar vacío.";
  }
  if ((input.bioHtml ?? "").length > LIMITE_BIO) {
    return `El texto «Sobre mí» no puede superar ${LIMITE_BIO} caracteres.`;
  }
  if ((input.address ?? "").length > LIMITE_DIRECCION) {
    return `La dirección no puede superar ${LIMITE_DIRECCION} caracteres.`;
  }
  if ((input.locationName ?? "").length > LIMITE_LUGAR) {
    return `El lugar de consulta no puede superar ${LIMITE_LUGAR} caracteres.`;
  }
  return null;
}

export async function obtenerInformacionPublica(): Promise<InformacionPublica> {
  // Lectura de la web pública: SIEMPRE con el cliente anon para que la página
  // se vea igual estés logueada o no (con la sesión de la dueña se vería más).
  return leerInformacion(createPublicClient());
}

// Lectura del panel: con sesión, para editar la ficha aunque esté inactiva.
export async function obtenerInformacionParaPanel(): Promise<InformacionPublica> {
  return leerInformacion(await createServerClient());
}

async function leerInformacion(
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<InformacionPublica> {
  const vacia: InformacionPublica = {
    fullName: "",
    tagline: "",
    licenseNumber: "",
    phonePublic: "",
    emailPublic: "",
    bioHtml: "",
    address: "",
    locationName: "",
  };
  try {
    const { data } = await supabase.from("professional_profile").select(SELECT).maybeSingle();
    if (!data) return vacia;
    return aDatos(data as unknown as FilaPerfil);
  } catch {
    return vacia;
  }
}

export async function guardarInformacionPublica(
  input: InformacionPublica,
): Promise<ResultadoInformacion> {
  const errorValidacion = validar(input);
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: perfil } = await supabase.from("professional_profile").select("id").maybeSingle();
  if (!perfil) {
    return { ok: false, error: "No se pudo encontrar tu perfil. Cierra sesión y vuelve a entrar." };
  }

  const { data, error } = await supabase
    .from("professional_profile")
    .update({
      full_name: input.fullName.trim(),
      tagline: input.tagline?.trim() || null,
      license_number: input.licenseNumber?.trim() || null,
      phone_public: input.phonePublic?.trim() || null,
      email_public: input.emailPublic?.trim() || null,
      bio: sanitizarHtml(input.bioHtml),
      address: input.address?.trim() || null,
      location_name: input.locationName?.trim() || null,
    })
    .eq("id", perfil.id)
    .select(SELECT)
    .single();

  if (error || !data) return { ok: false, error: "No se pudo guardar la información pública." };

  revalidarWebPublica();
  return { ok: true, datos: aDatos(data as unknown as FilaPerfil) };
}
