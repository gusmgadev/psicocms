import { verifySupabaseConnection } from '@/services/instalacion';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const installToken = formData?.get('installToken');

  const validToken = process.env.INSTALL_TOKEN;
  if (!validToken || typeof installToken !== 'string' || installToken.trim() !== validToken) {
    return NextResponse.json({ ok: false, error: 'Token de instalación inválido. Revisa la variable INSTALL_TOKEN en .env.local.' });
  }

  const result = await verifySupabaseConnection();
  return NextResponse.json(result);
}
