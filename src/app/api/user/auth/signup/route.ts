import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase, supabaseAdmin } from '@/lib/supabase-server';
import { setUserAuthCookie } from '@/lib/user-auth';
import { ensureUserProfile } from '@/lib/user-profile';

/**
 * POST /api/user/auth/signup
 * Body: { email, password, displayName }
 *
 * Admin API ile kullanıcı oluşturulur (email_confirm: true) — doğrulama maili gönderilmez.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = body?.email?.trim();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli.' }, { status: 400 });
    }
    const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : '';
    if (!displayName) {
      return NextResponse.json({ error: 'Kullanıcı adı gerekli.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    if (createError) {
      const msg = createError.message.toLowerCase();
      const message =
        msg.includes('already') || msg.includes('registered')
          ? 'Bu e-posta adresi zaten kayıtlı.'
          : createError.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userId = created.user?.id;
    if (userId) {
      await ensureUserProfile({
        id: userId,
        email: created.user.email,
        displayName,
      });
    }

    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Hesap oluşturuldu ancak oturum açılamadı. Lütfen giriş yapın.' },
        { status: 500 },
      );
    }

    const token = signIn.session?.access_token;
    const res = NextResponse.json({ user: signIn.user, session: signIn.session });

    if (token) {
      setUserAuthCookie(res, token);
    }

    return res;
  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kayıt oluşturulamadı.' },
      { status: 500 },
    );
  }
}
