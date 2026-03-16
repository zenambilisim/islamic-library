import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-server';

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 * Supabase Auth ile email/şifre girişi (sunucu tarafı).
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Auth yapılandırılmamış.' },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gerekli.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message =
        error.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : error.message;
      return NextResponse.json({ error: message }, { status: 401 });
    }

    const token = data.session?.access_token;
    const res = NextResponse.json({
      user: data.user,
      session: data.session,
    });
    if (token) {
      res.cookies.set('sb-auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 gün
        path: '/',
      });
    }
    return res;
  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Giriş yapılamadı.' },
      { status: 500 }
    );
  }
}
