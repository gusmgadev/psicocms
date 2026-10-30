import { createAuthClient, limpiarCookiesSesion } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  await limpiarCookiesSesion();
  return NextResponse.json({ ok: true, redirect: '/acceso-psicologa' });
}