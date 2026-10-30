// src/actions/auth.ts
// Server Actions para autenticación

'use server';

import type { User } from '@supabase/supabase-js';
import { createClient as createServerClient, createAuthClient, limpiarCookiesSesion } from '@/lib/supabase/server';
import { checkRateLimit, limpiarRateLimit } from '@/services/rate-limit';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

function urlSitio(): string {
  const valor = process.env.NEXT_PUBLIC_URL?.trim();
  if (valor) return valor.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export async function loginAction(formData: FormData): Promise<{ ok: boolean; error?: string; redirect?: string; mfaRequerido?: boolean }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const remember = formData.get('remember') === 'true';

  // Validaciones básicas
  if (!email || !password) {
    return { ok: false, error: 'Email y contraseña son obligatorios' };
  }

  // Rate limiting por IP (x-forwarded-for en Vercel/proxies)
  const cabeceras = await headers();
  const ipCruda =
    cabeceras.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    cabeceras.get('x-real-ip')?.trim() ||
    'unknown';
  const ip = ipCruda || 'unknown';
  const rateLimitResult = await checkRateLimit(`login:${ip}`, 'login', 5, 15 * 60 * 1000); // 5 intentos / 15 min
  if (!rateLimitResult.allowed) {
    return { ok: false, error: 'Demasiados intentos. Intenta de nuevo más tarde.' };
  }

  // Rate limiting por email
  const emailRateLimit = await checkRateLimit(`login:email:${email}`, 'login', 5, 15 * 60 * 1000); // 5 intentos / 15 min
  if (!emailRateLimit.allowed) {
    return { ok: false, error: 'Demasiados intentos para este email. Intenta de nuevo más tarde.' };
  }

  // Cookies de sesiones antiguas (formatos viejos o duplicadas) fuera:
  // si se mezclan con la nueva, la sesión no se reconoce y el login vuelve al inicio.
  await limpiarCookiesSesion();

  const supabase = await createAuthClient();

  // 1. Autenticar con email + contraseña
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    // Mensaje genérico para no revelar si el email existe
    return { ok: false, error: 'Los datos no son correctos' };
  }

  // 2. Si la verificación en dos pasos está activada, pedir el código TOTP
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
    return { ok: false, mfaRequerido: true };
  }

  // 3. Login exitoso - configurar cookies con maxAge si "recordar"
  // @supabase/ssr maneja las cookies automáticamente, pero podemos ajustar maxAge
  // mediante las opciones de la sesión en Supabase Auth Dashboard o aquí si necesitamos control fino

  // Registrar intento exitoso (limpiar rate limit)
  // No es estrictamente necesario, pero se podría hacer

  // Acceso completo: los intentos correctos no consumen cuota de rate limit
  await limpiarRateLimit([`login:${ip}`, `login:email:${email}`], 'login');

  revalidatePath('/panel-psicologa');
  return { ok: true, redirect: '/panel-psicologa' };
}

export async function logoutAction(): Promise<{ ok: boolean; redirect?: string }> {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  await limpiarCookiesSesion();
  revalidatePath('/acceso-psicologa');
  return { ok: true, redirect: '/acceso-psicologa' };
}

export async function getSessionAction(): Promise<{ user: User | null }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { user };
}

export async function recoverPasswordAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const email = formData.get('email') as string;

  if (!email) {
    return { ok: false, error: 'Email obligatorio' };
  }

  // Rate limiting para recuperación
  const rateLimitResult = await checkRateLimit(`recover:${email}`, 'password_recovery', 2, 60 * 60 * 1000); // 2/hora
  if (!rateLimitResult.allowed) {
    // Respuesta idéntica aunque exista o no la cuenta
    return { ok: true };
  }

  const supabase = await createServerClient();

  // Enviar email de recuperación - siempre devuelve éxito aunque el email no exista
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${urlSitio()}/acceso-psicologa?recover=true`,
  });

  // Siempre devolver éxito para no revelar si la cuenta existe
  return { ok: true };
}

export async function updatePasswordAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, error: 'Todos los campos son obligatorios' };
  }

  if (newPassword.length < 12) {
    return { ok: false, error: 'La contraseña debe tener al menos 12 caracteres' };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden' };
  }

  const supabase = await createAuthClient();

  // Verificar sesión actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sesión expirada' };
  }

  // Verificar contraseña actual intentando hacer login
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (verifyError) {
    return { ok: false, error: 'La contraseña actual no es correcta' };
  }

  // Actualizar contraseña
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { ok: false, error: 'Error actualizando la contraseña' };
  }

  return { ok: true };
}