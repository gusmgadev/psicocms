// src/actions/auth.ts
// Server Actions para autenticación

'use server';

import type { User } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/services/rate-limit';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function loginAction(formData: FormData): Promise<{ ok: boolean; error?: string; redirect?: string }> {
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;
  const remember = formData.get('remember') === 'true';

  // Validaciones básicas
  if (!email || !phone || !password) {
    return { ok: false, error: 'Email, teléfono y contraseña son obligatorios' };
  }

  // Rate limiting por IP (usar header x-forwarded-for o similar en producción)
  const ip = 'unknown'; // En producción obtener de headers
  const rateLimitResult = await checkRateLimit(`login:${ip}`, 'login', 5, 15 * 60 * 1000); // 5 intentos / 15 min
  if (!rateLimitResult.allowed) {
    return { ok: false, error: 'Demasiados intentos. Intenta de nuevo más tarde.' };
  }

  // Rate limiting por email
  const emailRateLimit = await checkRateLimit(`login:email:${email}`, 'login', 3, 15 * 60 * 1000); // 3 intentos / 15 min
  if (!emailRateLimit.allowed) {
    return { ok: false, error: 'Demasiados intentos para este email. Intenta de nuevo más tarde.' };
  }

  const supabase = await createServerClient();

  // 1. Autenticar con email + contraseña
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    // Mensaje genérico para no revelar si el email existe
    return { ok: false, error: 'Los datos no son correctos' };
  }

  // 2. Verificar teléfono con RPC verify_login_phone
  const cleanPhone = phone.replace(/\D/g, '');
  const { data: phoneOk, error: phoneError } = await supabase.rpc('verify_login_phone', {
    p_phone: cleanPhone,
  });

  if (phoneError || !phoneOk) {
    // Cerrar sesión y mostrar mensaje genérico
    await supabase.auth.signOut();
    return { ok: false, error: 'Los datos no son correctos' };
  }

  // 3. Login exitoso - configurar cookies con maxAge si "recordar"
  // @supabase/ssr maneja las cookies automáticamente, pero podemos ajustar maxAge
  // mediante las opciones de la sesión en Supabase Auth Dashboard o aquí si necesitamos control fino

  // Registrar intento exitoso (limpiar rate limit)
  // No es estrictamente necesario, pero se podría hacer

  revalidatePath('/panel-psicologa');
  return { ok: true, redirect: '/panel-psicologa' };
}

export async function logoutAction(): Promise<{ ok: boolean; redirect?: string }> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
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
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/acceso-psicologa?recover=true`,
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

  const supabase = await createServerClient();

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