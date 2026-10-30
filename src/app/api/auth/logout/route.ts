import { createAuthClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true, redirect: '/acceso-psicologa' });
}