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

// Limpia los intentos acumulados tras un acceso exitoso: solo los intentos
// fallidos deben consumir cuota, si no un usuario legítimo se bloquea solo.
export async function limpiarRateLimit(
  identifiers: string[],
  eventType: string
): Promise<void> {
  if (identifiers.length === 0) return;

  try {
    const admin = createAdminClient();
    await admin
      .from('rate_limit_events')
      .delete()
      .eq('event_type', eventType)
      .in('identifier', identifiers);
  } catch {
    // El rate limit nunca debe impedir un acceso ya autenticado
  }
}