// src/services/perfil-privado.ts
// Datos privados de la psicóloga: nombre, teléfono de acceso, avatar y
// cambio del email de acceso (con contraseña actual, verificado en la action).

import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidarWebPublica } from "@/lib/revalidar-web";
import type { User } from "@supabase/supabase-js";

export interface PerfilPrivado {
  nombre: string;
  telefonoPrivado: string;
  avatarUrl: string | null;
}

export interface CabeceraUsuario {
  nombre: string | null;
  email: string | null;
  avatarUrl: string | null;
}

const LIMITE_NOMBRE = 150;
const LIMITE_TELEFONO = 30;
const LIMITE_AVATAR = 2 * 1024 * 1024;
const TIPOS_AVATAR = ["image/jpeg", "image/png", "image/webp"];

interface FilaPerfil {
  full_name: string;
  phone_private: string | null;
  avatar_path: string | null;
}

function urlAvatar(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

export async function obtenerPerfilPrivado(): Promise<PerfilPrivado> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("professional_profile")
    .select("full_name, phone_private, avatar_path")
    .maybeSingle();

  if (!data) return { nombre: "", telefonoPrivado: "", avatarUrl: null };
  const f = data as unknown as FilaPerfil;
  return {
    nombre: f.full_name ?? "",
    telefonoPrivado: f.phone_private ?? "",
    avatarUrl: f.avatar_path ? urlAvatar(f.avatar_path) : null,
  };
}

export async function obtenerCabeceraUsuario(user: User): Promise<CabeceraUsuario> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("professional_profile")
    .select("full_name, avatar_path")
    .maybeSingle();

  const meta = user.user_metadata as { full_name?: string } | undefined;
  const f = (data ?? null) as { full_name?: string; avatar_path?: string | null } | null;

  return {
    nombre: f?.full_name || meta?.full_name || null,
    email: user.email ?? null,
    avatarUrl: f?.avatar_path ? urlAvatar(f.avatar_path) : null,
  };
}

function validar(nombre: string, telefono: string): string | null {
  const n = nombre.trim();
  if (n.length < 2 || n.length > LIMITE_NOMBRE) {
    return `El nombre debe tener entre 2 y ${LIMITE_NOMBRE} caracteres.`;
  }
  const t = telefono.trim();
  if (t && !/^[0-9 +()\-\.]{5,30}$/.test(t)) {
    return "El teléfono solo puede contener números, espacios y los símbolos + ( ) - .";
  }
  return null;
}

export async function guardarPerfilPrivado(
  nombre: string,
  telefonoPrivado: string
): Promise<{ ok: boolean; error?: string; perfil?: PerfilPrivado }> {
  const errorValidacion = validar(nombre ?? "", telefonoPrivado ?? "");
  if (errorValidacion) return { ok: false, error: errorValidacion };

  const supabase = await createServerClient();
  const { data: perfil } = await supabase.from("professional_profile").select("id").maybeSingle();
  if (!perfil) {
    return { ok: false, error: "No se pudo encontrar tu perfil. Cierra sesión y vuelve a entrar." };
  }

  const { data, error } = await supabase
    .from("professional_profile")
    .update({
      full_name: nombre.trim(),
      phone_private: telefonoPrivado.trim() || null,
    })
    .eq("id", perfil.id)
    .select("full_name, phone_private, avatar_path")
    .single();

  if (error || !data) {
    return { ok: false, error: "No se pudieron guardar los datos del perfil." };
  }

  revalidarWebPublica();
  const f = data as unknown as FilaPerfil;
  return {
    ok: true,
    perfil: {
      nombre: f.full_name ?? "",
      telefonoPrivado: f.phone_private ?? "",
      avatarUrl: f.avatar_path ? urlAvatar(f.avatar_path) : null,
    },
  };
}

// ============================================================
// Avatar
// ============================================================

export async function subirAvatar(
  archivo: File
): Promise<{ ok: boolean; error?: string; url?: string }> {
  if (!archivo || archivo.size === 0) {
    return { ok: false, error: "No se ha seleccionado ningún archivo." };
  }
  if (!TIPOS_AVATAR.includes(archivo.type)) {
    return { ok: false, error: "Solo se permiten imágenes JPG, PNG o WebP." };
  }
  if (archivo.size > LIMITE_AVATAR) {
    return { ok: false, error: "La foto no debe superar 2 MB." };
  }

  const supabase = await createServerClient();
  const { data: perfil } = await supabase
    .from("professional_profile")
    .select("id, avatar_path")
    .maybeSingle();
  if (!perfil) {
    return { ok: false, error: "No se pudo encontrar tu perfil." };
  }

  const anterior = (perfil as { avatar_path: string | null }).avatar_path;

  const extension = archivo.name.split(".").pop()?.toLowerCase();
  const sufijo =
    extension === "png" || extension === "jpeg" || extension === "webp"
      ? extension === "jpeg"
        ? "jpg"
        : extension
      : archivo.type === "image/png"
        ? "png"
        : archivo.type === "image/webp"
          ? "webp"
          : "jpg";

  const path = `perfil/${crypto.randomUUID()}.${sufijo}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, archivo, { contentType: archivo.type, upsert: false });
  if (uploadError) return { ok: false, error: "No se pudo subir la foto." };

  const { error: dbError } = await supabase
    .from("professional_profile")
    .update({ avatar_path: path })
    .eq("id", perfil.id);
  if (dbError) {
    await supabase.storage.from("avatars").remove([path]);
    return { ok: false, error: "No se pudo guardar la foto." };
  }

  if (anterior && anterior !== path) {
    await supabase.storage.from("avatars").remove([anterior]);
  }

  return { ok: true, url: urlAvatar(path) };
}

export async function quitarAvatar(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { data: perfil } = await supabase
    .from("professional_profile")
    .select("id, avatar_path")
    .maybeSingle();
  if (!perfil) return { ok: false, error: "No se pudo encontrar tu perfil." };

  const anterior = (perfil as { avatar_path: string | null }).avatar_path;

  const { error } = await supabase
    .from("professional_profile")
    .update({ avatar_path: null })
    .eq("id", perfil.id);
  if (error) return { ok: false, error: "No se pudo quitar la foto." };

  if (anterior) {
    await supabase.storage.from("avatars").remove([anterior]);
  }
  return { ok: true };
}

// ============================================================
// Verificación en dos pasos (estado para el panel)
// ============================================================

export async function obtenerEstadoMfa(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  if (!data) return false;
  return data.totp.some((f) => f.status === "verified");
}

// ============================================================
// Email de acceso (la action verifica la contraseña actual antes de llamar)
// ============================================================

export async function cambiarEmailAcceso(
  user: User,
  nuevoEmail: string,
  passwordActual: string
): Promise<{ ok: boolean; error?: string; email?: string }> {
  const email = nuevoEmail.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { ok: false, error: "El email no tiene un formato válido." };
  }
  if (!user.email) {
    return { ok: false, error: "No se pudo leer tu email actual." };
  }
  if (email.toLowerCase() === user.email.toLowerCase()) {
    return { ok: false, error: "Ese es tu email actual." };
  }

  const supabase = await createServerClient();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: passwordActual,
  });
  if (verifyError) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email,
    email_confirm: true,
  });
  if (error) {
    return { ok: false, error: "No se pudo cambiar el email. Puede que ya esté en uso." };
  }

  return { ok: true, email };
}
