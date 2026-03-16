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
  } catch (err) {
    console.error('Logout API error:', err);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sb-auth-token', '', { maxAge: 0, path: '/' });
  return res;
}
