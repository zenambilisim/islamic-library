import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-server';

/**
 * POST /api/auth/logout
 * Supabase oturumunu kapatır.
 */
export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true });
  }
  try {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Logout API error:', err);
    return NextResponse.json({ ok: true });
  }
}
