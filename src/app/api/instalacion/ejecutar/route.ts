import { instalarAction } from '@/actions/instalar';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await instalarAction(formData);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: 'Error inesperado' }, { status: 500 });
  }
}