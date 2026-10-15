import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ ok: false, error: 'No se ha seleccionado ningún archivo' }, { status: 400 });
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Solo se permiten imágenes JPG, PNG o WebP' }, { status: 400 });
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'La imagen no debe superar 5 MB' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Generar nombre único
    const ext = file.name.split('.').pop() || 'webp';
    const fileName = `psicologa-${crypto.randomUUID()}.${ext}`;
    const filePath = `avatars/${fileName}`;

    // Subir a Storage
    const { error: uploadError } = await admin.storage
      .from('public-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ ok: false, error: 'Error subiendo la imagen' }, { status: 500 });
    }

    // Obtener URL pública
    const { data: { publicUrl } } = admin.storage
      .from('public-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ ok: true, path: publicUrl });
  } catch {
    return NextResponse.json({ ok: false, error: 'Error inesperado' }, { status: 500 });
  }
}