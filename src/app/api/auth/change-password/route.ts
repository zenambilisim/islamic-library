import { NextRequest, NextResponse } from 'next/server';
import {
  createAnonSupabaseClient,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase-server';

/**
 * POST /api/auth/change-password
 * Çerezdeki oturum + mevcut şifre doğrulaması ile Supabase Auth şifresini günceller.
 * Body: { currentPassword: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  const token = request.cookies.get('sb-auth-token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Oturum açmanız gerekir.' }, { status: 401 });
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user?.email) {
    return NextResponse.json(
      { error: 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.' },
      { status: 401 }
    );
  }

  let body: { currentPassword?: unknown; newPassword?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Mevcut ve yeni şifre gerekli.' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Yeni şifre en az 6 karakter olmalı.' }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'Yeni şifre mevcut şifre ile aynı olamaz.' }, { status: 400 });
  }

  const authClient = createAnonSupabaseClient();
  const { error: signErr } = await authClient.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  });
  if (signErr) {
    const msg =
      signErr.message === 'Invalid login credentials'
        ? 'Mevcut şifre hatalı.'
        : signErr.message;
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const { error: updErr } = await authClient.auth.updateUser({ password: newPassword });
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  const { data: sess } = await authClient.auth.getSession();
  const newToken = sess.session?.access_token;

  const res = NextResponse.json({ ok: true });
  if (newToken) {
    res.cookies.set('sb-auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  }
  return res;
}
