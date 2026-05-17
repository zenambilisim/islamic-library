import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase-server';
import { setUserAuthCookie } from '@/lib/user-auth';
import { ensureUserProfile } from '@/lib/user-profile';

/**
 * POST /api/user/auth/signup
 * Body: { email, password, displayName? }
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
    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: body?.displayName ? { display_name: String(body.displayName).trim() } : undefined,
      },
    });

    if (error) {
      const message =
        error.message === 'User already registered'
          ? 'Bu e-posta adresi zaten kayıtlı.'
          : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (data.user?.id) {
      const displayName = body?.displayName ? String(body.displayName).trim() : undefined;
      await ensureUserProfile({
        id: data.user.id,
        email: data.user.email,
        displayName: displayName || undefined,
      });
    }

    const token = data.session?.access_token;
    const res = NextResponse.json({
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !token,
    });

    if (token) {
      setUserAuthCookie(res, token);
    }

    return res;
  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kayıt oluşturulamadı.' },
      { status: 500 }
    );
  }
}
