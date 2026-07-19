import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase-server';
import { setUserAuthCookie } from '@/lib/user-auth';

/**
 * POST /api/user/auth/refresh
 * Body: { refresh_token }
 *
 * Mobil istemciler access_token süresi dolunca yeni session alır.
 * Web cookie istemcileri de kullanabilir; başarılıysa cookie güncellenir.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const refreshToken =
      typeof body?.refresh_token === 'string'
        ? body.refresh_token.trim()
        : typeof body?.refreshToken === 'string'
          ? body.refreshToken.trim()
          : '';

    if (!refreshToken) {
      return NextResponse.json({ error: 'refresh_token gerekli.' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message || 'Oturum yenilenemedi. Lütfen tekrar giriş yapın.' },
        { status: 401 },
      );
    }

    const res = NextResponse.json({
      user: data.user,
      session: data.session,
    });

    if (data.session.access_token) {
      setUserAuthCookie(res, data.session.access_token);
    }

    return res;
  } catch (err) {
    console.error('User refresh API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Oturum yenilenemedi.' },
      { status: 500 },
    );
  }
}
