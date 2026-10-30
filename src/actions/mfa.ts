// src/actions/mfa.ts
// Server Actions de la verificación en dos pasos (TOTP).
// La activación/desactivación exige sesión iniciada; la verificación durante
// el login trabaja sobre la sesión de primer factor (aal1) y la promueve a aal2.

"use server";

import { createAuthClient } from "@/lib/supabase/server";
import { exigirSesion } from "@/lib/auth-guard";
import { checkRateLimit } from "@/services/rate-limit";

type ClienteMfa = Awaited<ReturnType<typeof createAuthClient>>;

const CODIGO_INVALIDO = "El código no es correcto. Compruébalo e inténtalo de nuevo.";

function esCodigoValido(codigo: string): boolean {
  return /^\d{6}$/.test((codigo ?? "").trim());
}

async function factorTotp(
  supabase: ClienteMfa,
  estado: "verified" | "unverified"
): Promise<{ id: string } | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return null;
  const factor = data.totp.find((f) => f.status === estado);
  return factor ? { id: factor.id } : null;
}

async function verificarCodigo(
  supabase: ClienteMfa,
  factorId: string,
  codigo: string
): Promise<boolean> {
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) return false;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: codigo.trim(),
  });
  return !verify.error;
}

export async function iniciarMfaAction(): Promise<{
  ok: boolean;
  error?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
}> {
  const { user } = await exigirSesion();

  const limite = await checkRateLimit(`mfa-enroll:${user.id}`, "mfa_verify", 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos y vuelve a probar." };
  }

  const supabase = await createAuthClient();
  const listado = await supabase.auth.mfa.listFactors();
  if (listado.error || !listado.data) {
    return { ok: false, error: "No se pudo preparar la verificación en dos pasos." };
  }
  const totps = listado.data.totp as { id: string; status: string }[];
  if (totps.some((f) => f.status === "verified")) {
    return { ok: false, error: "La verificación en dos pasos ya está activada." };
  }

  // Limpia cualquier factor pendiente de una activación anterior interrumpida
  for (const pendiente of totps.filter((f) => f.status === "unverified")) {
    await supabase.auth.mfa.unenroll({ factorId: pendiente.id });
  }

  const enroll = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "PsicoCMS",
  });
  if (enroll.error || !enroll.data) {
    return { ok: false, error: "No se pudo iniciar la verificación en dos pasos." };
  }

  const totp = enroll.data.totp as { qr_code?: string; secret?: string } | undefined;
  return {
    ok: true,
    factorId: enroll.data.id,
    qrCode: totp?.qr_code ?? undefined,
    secret: totp?.secret ?? undefined,
  };
}

export async function activarMfaAction(
  factorId: string,
  codigo: string
): Promise<{ ok: boolean; error?: string }> {
  const { user } = await exigirSesion();
  if (typeof factorId !== "string" || !factorId || !esCodigoValido(codigo)) {
    return { ok: false, error: CODIGO_INVALIDO };
  }

  const limite = await checkRateLimit(`mfa:${user.id}`, "mfa_verify", 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos y vuelve a probar." };
  }

  const supabase = await createAuthClient();
  const pendiente = await factorTotp(supabase, "unverified");
  if (!pendiente || pendiente.id !== factorId) {
    return { ok: false, error: "La verificación ha caducado. Empieza de nuevo." };
  }

  const ok = await verificarCodigo(supabase, factorId, codigo);
  if (!ok) return { ok: false, error: CODIGO_INVALIDO };

  return { ok: true };
}

export async function desactivarMfaAction(): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();

  const supabase = await createAuthClient();
  const activo = await factorTotp(supabase, "verified");
  if (!activo) {
    return { ok: false, error: "No tienes la verificación en dos pasos activada." };
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId: activo.id });
  if (error) {
    return { ok: false, error: "No se pudo desactivar la verificación en dos pasos." };
  }

  return { ok: true };
}

export async function verificarCodigoMfaAction(
  codigo: string
): Promise<{ ok: boolean; error?: string }> {
  if (!esCodigoValido(codigo)) {
    return { ok: false, error: CODIGO_INVALIDO };
  }

  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "La sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") {
    return { ok: true };
  }

  const limite = await checkRateLimit(`mfa-login:${user.id}`, "mfa_verify", 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos y vuelve a probar." };
  }

  const verificado = await factorTotp(supabase, "verified");
  if (!verificado) {
    return { ok: false, error: "La sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const ok = await verificarCodigo(supabase, verificado.id, codigo);
  if (!ok) return { ok: false, error: CODIGO_INVALIDO };

  return { ok: true };
}
