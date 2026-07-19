import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase-server';
import { setUserAuthCookie } from '@/lib/user-auth';
import { ensureUserProfile } from '@/lib/user-profile';

/**
 * POST /api/user/auth/login
 * Body: { email, password }
 *
 * Yanıt: { user, session } — mobil istemci `session.access_token` saklayıp
 * korumalı isteklerde `Authorization: Bearer <access_token>` göndermelidir.
 * Web için ayrıca httpOnly cookie set edilir.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli.' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const message =
        error.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : error.message;
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (data.user?.id) {
      const metaName =
        typeof data.user.user_metadata?.display_name === 'string'
          ? data.user.user_metadata.display_name.trim() || undefined
          : undefined;
      await ensureUserProfile({
        id: data.user.id,
        email: data.user.email,
        displayName: metaName,
      });
    }

    const token = data.session?.access_token;
    const res = NextResponse.json({ user: data.user, session: data.session });
    if (token) {
      setUserAuthCookie(res, token);
    }
    return res;
  } catch (err) {
    console.error('User login API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Giriş yapılamadı.' },
      { status: 500 }
    );
  }
}
