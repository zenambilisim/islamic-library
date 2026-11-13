import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase, supabaseAdmin } from '@/lib/supabase-server';
import { clearUserAuthCookie, getUserFromRequest } from '@/lib/user-auth';
import { deleteUserAccount } from '@/lib/user-profile';

/**
 * POST /api/user/auth/delete
 * Body: { password }
 * Auth: `Authorization: Bearer <access_token>` veya `sb-user-token` cookie.
 *
 * Şifre doğrulanır, okuma listesi + profil + auth kullanıcısı silinir, oturum kapatılır.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  const auth = await getUserFromRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) {
      return NextResponse.json({ error: 'Şifre gerekli.' }, { status: 400 });
    }

    const email = auth.user.email?.trim();
    if (!email) {
      return NextResponse.json({ error: 'Hesap e-postası bulunamadı.' }, { status: 400 });
    }

    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (passwordError) {
      return NextResponse.json({ error: 'Şifre hatalı.' }, { status: 401 });
    }

    const { error } = await deleteUserAccount(auth.user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    clearUserAuthCookie(res);
    return res;
  } catch (err) {
    console.error('User delete account API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hesap silinemedi.' },
      { status: 500 }
    );
  }
}
