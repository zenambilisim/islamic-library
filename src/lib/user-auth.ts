import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase-server';

import { USER_AUTH_COOKIE } from './auth-constants';

export { USER_AUTH_COOKIE };

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() ?? '';
const supabaseAnonKey =
  (process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
};

export function setUserAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(USER_AUTH_COOKIE, token, COOKIE_OPTIONS);
}

export function clearUserAuthCookie(res: NextResponse) {
  res.cookies.set(USER_AUTH_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
}

export function getUserTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(USER_AUTH_COOKIE)?.value;
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<{ user: User } | { error: string; status: number }> {
  if (!isSupabaseConfigured) {
    return { error: 'Auth yapılandırılmamış.', status: 503 };
  }
  const token = getUserTokenFromRequest(request);
  if (!token) {
    return { error: 'Oturum açmanız gerekir.', status: 401 };
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { error: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.', status: 401 };
  }
  return { user: data.user };
}

/** Kullanıcı JWT ile RLS uygulanan istemci */
export function supabaseWithUserToken(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
