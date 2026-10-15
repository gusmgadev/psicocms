import { createClient as createServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/services/rate-limit';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email obligatorio' }, { status: 400 });
    }

    // Rate limiting para recuperación
    const rateLimitResult = await checkRateLimit(`recover:${email}`, 'password_recovery', 2, 60 * 60); // 2/hora
    if (!rateLimitResult.allowed) {
      // Respuesta idéntica aunque exista o no la cuenta
      return NextResponse.json({ ok: true });
    }

    const supabase = await createServerClient();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Enviar email de recuperación - siempre devuelve éxito aunque el email no exista
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/acceso-psicologa?recover=true`,
    });

    // Siempre devolver éxito para no revelar si la cuenta existe
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Siempre éxito genérico
  }
}