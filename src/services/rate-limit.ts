// src/services/rate-limit.ts
// Servicio para rate limiting usando la función RPC de Supabase

import { createAdminClient } from '@/lib/supabase/admin';

export async function checkRateLimit(
  identifier: string,
  eventType: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; attemptsUsed: number; attemptsRemaining: number; resetAt: string }> {
  const admin = createAdminClient();
  
  const windowSec = Math.ceil(windowMs / 1000);
  
  const { data, error } = await admin.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_event_type: eventType,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSec,
  });

  if (error || !data || data.length === 0) {
    // En caso de error, permitir (fail-open) pero loggear
    console.warn('Rate limit check failed:', error);
    return { allowed: true, attemptsUsed: 0, attemptsRemaining: maxAttempts, resetAt: new Date(Date.now() + windowMs).toISOString() };
  }

  return data[0];
}