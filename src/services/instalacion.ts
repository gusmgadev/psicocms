// src/services/instalacion.ts
// Servicio para la instalación inicial

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface InstalacionData {
  // Datos de acceso
  email: string;
  phone: string;
  password: string;
  
  // Datos de la psicóloga
  fullName: string;
  tagline: string;
  licenseNumber: string;
  phonePublic: string;
  emailPublic: string;
  bio: string;
  address: string;
  locationName: string;
  
  // Configuración de sesiones
  sessionDurationOnline: number;
  sessionDurationInperson: number;
  breakBetweenSessionsOnline: number;
  breakBetweenSessionsInperson: number;
  breakEnabledOnline: boolean;
  breakEnabledInperson: boolean;
  
  // Servicios y especialidades
  services: string[];
  specialties: string[];
  
  // Planes
  plans: Array<{
    name: string;
    description: string;
    priceOnline: number;
    priceInperson: number;
    features: string[];
  }>;
  
  // Disponibilidad
  availability: Array<{
    modality: 'online' | 'inperson';
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  
  // Tema
  theme: string;
  layoutMode: 'landing' | 'multipage';
  
  // Foto
  photoPath?: string;
  
  // INSTALL_TOKEN
  installToken: string;
}

// Verificar si la instalación ya se completó
export async function checkSetupCompleted(): Promise<boolean> {
  const client = await createServerClient();
  
  // Verificar en site_settings
  const { data: siteSettings } = await client
    .from('site_settings')
    .select('setup_completed')
    .eq('id', true)
    .single();
  
  if (siteSettings?.setup_completed) return true;
  
  // Verificar en professional_profile
  const { data: profile } = await client
    .from('professional_profile')
    .select('setup_completed')
    .eq('is_active', true)
    .single();
  
  return profile?.setup_completed ?? false;
}

// Verificar conexión con Supabase
export async function verifySupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = await createServerClient();
    const { error } = await client.from('site_settings').select('id').limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error de conexión' };
  }
}

// Ejecutar instalación completa
export async function runInstallation(data: InstalacionData): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  
  // Verificar INSTALL_TOKEN
  const validToken = process.env.INSTALL_TOKEN;
  if (!validToken || data.installToken !== validToken) {
    return { ok: false, error: 'Token de instalación inválido' };
  }
  
  // Verificar si ya hay un usuario
  const { data: { users } } = await admin.auth.admin.listUsers();
  if (users.length > 0) {
    return { ok: false, error: 'La instalación ya se realizó' };
  }
  
  // Verificar si setup_completed ya es true
  const { data: siteSettings } = await admin
    .from('site_settings')
    .select('setup_completed')
    .eq('id', true)
    .single();
  
  if (siteSettings?.setup_completed) {
    return { ok: false, error: 'La instalación ya se completó' };
  }
  
  try {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone,
      },
    });
    
    if (authError || !authData.user) {
      return { ok: false, error: authError?.message || 'Error creando usuario' };
    }
    
    const userId = authData.user.id;
    
    // 2. Crear professional_profile
    const { error: profileError } = await admin
      .from('professional_profile')
      .insert({
        user_id: userId,
        full_name: data.fullName,
        tagline: data.tagline,
        license_number: data.licenseNumber,
        phone_public: data.phonePublic,
        email_public: data.emailPublic,
        bio: data.bio,
        address: data.address,
        location_name: data.locationName,
        session_duration_online: data.sessionDurationOnline,
        session_duration_inperson: data.sessionDurationInperson,
        break_between_sessions_online: data.breakBetweenSessionsOnline,
        break_between_sessions_inperson: data.breakBetweenSessionsInperson,
        break_enabled_online: data.breakEnabledOnline,
        break_enabled_inperson: data.breakEnabledInperson,
        avatar_path: data.photoPath,
        setup_completed: true,
        is_active: true,
      });
    
    if (profileError) {
      // Rollback: eliminar usuario
      await admin.auth.admin.deleteUser(userId);
      return { ok: false, error: 'Error guardando perfil profesional' };
    }
    
    // 3. Actualizar site_settings
    const { error: settingsError } = await admin
      .from('site_settings')
      .upsert({
        id: true,
        active_theme: data.theme,
        layout_mode: data.layoutMode,
        setup_completed: true,
      });
    
    if (settingsError) {
      return { ok: false, error: 'Error guardando configuración del sitio' };
    }
    
    // 4. Insertar servicios
    if (data.services.length > 0) {
      const servicesToInsert = data.services.map((name, i) => ({
        name,
        description: '',
        order_index: i,
        is_active: true,
      }));
      await admin.from('services').insert(servicesToInsert);
    }
    
    // 5. Insertar especialidades
    if (data.specialties.length > 0) {
      const specialtiesToInsert = data.specialties.map((name, i) => ({
        name,
        description: '',
        order_index: i,
        is_active: true,
      }));
      await admin.from('specialties').insert(specialtiesToInsert);
    }
    
    // 6. Insertar planes
    if (data.plans.length > 0) {
      const plansToInsert = data.plans.map((p, i) => ({
        name: p.name,
        description: p.description,
        price_online: p.priceOnline,
        price_inperson: p.priceInperson,
        features: p.features,
        order_index: i,
        is_active: true,
      }));
      await admin.from('plans').insert(plansToInsert);
    }
    
    // 7. Insertar disponibilidad
    if (data.availability.length > 0) {
      const availabilityToInsert = data.availability.map(a => ({
        modality: a.modality,
        day_of_week: a.dayOfWeek,
        start_time: a.startTime,
        end_time: a.endTime,
        is_active: true,
      }));
      await admin.from('availability_slots').insert(availabilityToInsert);
    }
    
    // 8. Registrar tema en public_phrases (para el selector)
    await admin.from('public_phrases').upsert({
      key: `theme.${data.theme}.name`,
      value: data.theme,
      description: `Tema visual: ${data.theme}`,
    });
    
    return { ok: true };
  } catch (e) {
    console.error('Installation error:', e);
    return { ok: false, error: 'Error inesperado durante la instalación' };
  }
}