import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = createAdminClient();
  
  const { data: siteSettings } = await admin
    .from('site_settings')
    .select('setup_completed')
    .eq('id', true)
    .single();

  if (siteSettings?.setup_completed) {
    return NextResponse.json({ completed: true });
  }

  const { data: profile } = await admin
    .from('professional_profile')
    .select('setup_completed')
    .eq('is_active', true)
    .single();

  return NextResponse.json({ completed: profile?.setup_completed ?? false });
}