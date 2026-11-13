import { NextRequest, NextResponse } from 'next/server';
import {
  createAnonSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase-server';
import { getUserFromRequest, setUserAuthCookie } from '@/lib/user-auth';

/**
 * POST /api/user/auth/change-password
 * Body: { currentPassword, newPassword }
 * Auth: `Authorization: Bearer <access_token>` veya `sb-user-token` cookie.
 *
 * Mevcut şifre doğrulanır, yeni şifre yazılır. Yanıtta yeni `session` gelir (mobil token yenilemesi).
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  const auth = await getUserFromRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Mevcut ve yeni şifre gerekli.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Yeni şifre en az 6 karakter olmalı.' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: 'Yeni şifre mevcut şifre ile aynı olamaz.' },
        { status: 400 }
      );
    }

    const email = auth.user.email?.trim();
    if (!email) {
      return NextResponse.json({ error: 'Hesap e-postası bulunamadı.' }, { status: 400 });
    }

    const authClient = createAnonSupabaseClient();
    const { error: signErr } = await authClient.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signErr) {
      const message =
        signErr.message === 'Invalid login credentials'
          ? 'Mevcut şifre hatalı.'
          : signErr.message;
      return NextResponse.json({ error: message }, { status: 401 });
    }

    const { error: updErr } = await authClient.auth.updateUser({ password: newPassword });
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    const { data: sess } = await authClient.auth.getSession();
    const token = sess.session?.access_token;
    const res = NextResponse.json({ ok: true, session: sess.session ?? null });
    if (token) {
      setUserAuthCookie(res, token);
    }
    return res;
  } catch (err) {
    console.error('User change-password API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Şifre değiştirilemedi.' },
      { status: 500 }
    );
  }
}
