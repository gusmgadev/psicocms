import { verifySupabaseConnection } from '@/services/instalacion';
import { NextResponse } from 'next/server';

export async function POST() {
  const result = await verifySupabaseConnection();
  return NextResponse.json(result);
}