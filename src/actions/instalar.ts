// src/actions/instalar.ts
// Server Action para la instalación inicial

'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { runInstallation, verifySupabaseConnection } from '@/services/instalacion';
import { revalidatePath } from 'next/cache';

export async function instalarAction(formData: FormData): Promise<{ ok: boolean; error?: string; redirect?: string }> {
  // Validar INSTALL_TOKEN
  const installToken = formData.get('installToken') as string;
  const validToken = process.env.INSTALL_TOKEN;
  
  if (!validToken || installToken !== validToken) {
    return { ok: false, error: 'Token de instalación inválido' };
  }
  
  // Verificar si ya hay instalación completada
  const admin = createAdminClient();
  const { data: siteSettings } = await admin
    .from('site_settings')
    .select('setup_completed')
    .eq('id', true)
    .single();
  
  if (siteSettings?.setup_completed) {
    return { ok: false, error: 'La instalación ya se completó', redirect: '/acceso-psicologa' };
  }
  
  // Verificar si ya existe usuario
  const { data: { users } } = await admin.auth.admin.listUsers();
  if (users.length > 0) {
    return { ok: false, error: 'La instalación ya se realizó', redirect: '/acceso-psicologa' };
  }
  
  // Extraer datos del formulario
  const data = {
    // Datos de acceso
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
    
    // Datos de la psicóloga
    fullName: formData.get('fullName') as string,
    tagline: formData.get('tagline') as string,
    licenseNumber: formData.get('licenseNumber') as string,
    phonePublic: formData.get('phonePublic') as string,
    emailPublic: formData.get('emailPublic') as string,
    bio: formData.get('bio') as string,
    address: formData.get('address') as string,
    locationName: formData.get('locationName') as string,
    
    // Configuración de sesiones
    sessionDurationOnline: parseInt(formData.get('sessionDurationOnline') as string) || 50,
    sessionDurationInperson: parseInt(formData.get('sessionDurationInperson') as string) || 50,
    breakBetweenSessionsOnline: parseInt(formData.get('breakBetweenSessionsOnline') as string) || 0,
    breakBetweenSessionsInperson: parseInt(formData.get('breakBetweenSessionsInperson') as string) || 0,
    breakEnabledOnline: formData.get('breakEnabledOnline') === 'true',
    breakEnabledInperson: formData.get('breakEnabledInperson') === 'true',
    
    // Servicios (JSON string)
    services: JSON.parse(formData.get('services') as string || '[]'),
    specialties: JSON.parse(formData.get('specialties') as string || '[]'),
    
    // Planes (JSON string)
    plans: JSON.parse(formData.get('plans') as string || '[]'),
    
    // Disponibilidad (JSON string)
    availability: JSON.parse(formData.get('availability') as string || '[]'),
    
    // Tema
    theme: formData.get('theme') as string || 'base',
    layoutMode: (formData.get('layoutMode') as 'landing' | 'multipage') || 'multipage',
    
    // Foto
    photoPath: formData.get('photoPath') as string || undefined,
    
    // INSTALL_TOKEN
    installToken,
  };
  
  // Validaciones básicas
  if (!data.email || !data.phone || !data.password) {
    return { ok: false, error: 'Email, teléfono y contraseña son obligatorios' };
  }
  
  if (data.password.length < 12) {
    return { ok: false, error: 'La contraseña debe tener al menos 12 caracteres' };
  }
  
  if (!data.fullName) {
    return { ok: false, error: 'El nombre completo es obligatorio' };
  }
  
  // Ejecutar instalación
  const result = await runInstallation(data);
  
  if (result.ok) {
    revalidatePath('/instalacion');
    revalidatePath('/acceso-psicologa');
    return { ok: true, redirect: '/panel-psicologa' };
  }
  
  return { ok: false, error: result.error };
}

export async function verificarConexionAction(): Promise<{ ok: boolean; error?: string }> {
  return verifySupabaseConnection();
}

export async function subirFotoInstalacionAction(formData: FormData): Promise<{ ok: boolean; path?: string; error?: string }> {
  const file = formData.get('photo') as File;
  
  if (!file || file.size === 0) {
    return { ok: false, error: 'No se ha seleccionado ningún archivo' };
  }
  
  // Validar tipo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: 'Solo se permiten imágenes JPG, PNG o WebP' };
  }
  
  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: 'La imagen no debe superar 5 MB' };
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
    return { ok: false, error: 'Error subiendo la imagen' };
  }
  
  // Obtener URL pública
  const { data: { publicUrl } } = admin.storage
    .from('public-images')
    .getPublicUrl(filePath);
  
  return { ok: true, path: publicUrl };
}

export async function verificarInstalacionCompletadaAction(): Promise<{ completed: boolean }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('setup_completed')
    .eq('id', true)
    .single();
  
  return { completed: data?.setup_completed ?? false };
}