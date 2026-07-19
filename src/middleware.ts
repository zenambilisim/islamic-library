import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { USER_AUTH_COOKIE } from '@/lib/auth-constants';
import { LANG_COOKIE, isSupportedLanguage, normalizeLanguage } from '@/lib/locale';

const ADMIN_LOGIN = '/admin/login';
const USER_LOGIN = '/user/login';

function withLangCookie(request: NextRequest, response: NextResponse): NextResponse {
  const existing = request.cookies.get(LANG_COOKIE)?.value;
  if (existing && isSupportedLanguage(existing)) {
    return response;
  }
  // Geçersiz cookie veya yok → varsayılan tr
  response.cookies.set(LANG_COOKIE, normalizeLanguage(existing), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

/**
 * /admin/* — yönetici oturumu (sb-auth-token)
 * /library — okuyucu oturumu (sb-user-token)
 * /user/login — giriş yapmış okuyucuyu kütüphaneye yönlendir
 * Public — il_lang cookie yoksa tr yaz
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userToken = request.cookies.get(USER_AUTH_COOKIE)?.value;

  if (pathname === USER_LOGIN) {
    if (userToken) {
      return withLangCookie(request, NextResponse.redirect(new URL('/library', request.url)));
    }
    return withLangCookie(request, NextResponse.next());
  }

  if (pathname === '/library' || pathname.startsWith('/user/profile')) {
    if (!userToken) {
      const loginUrl = new URL(USER_LOGIN, request.url);
      loginUrl.searchParams.set('from', pathname === '/library' ? '/library' : '/user/profile');
      return withLangCookie(request, NextResponse.redirect(loginUrl));
    }
    return withLangCookie(request, NextResponse.next());
  }

  if (!pathname.startsWith('/admin')) {
    return withLangCookie(request, NextResponse.next());
  }

  if (pathname === ADMIN_LOGIN) {
    if (request.cookies.get('sb-auth-token')?.value) {
      return withLangCookie(
        request,
        NextResponse.redirect(new URL('/admin/dashboard', request.url)),
      );
    }
    return withLangCookie(request, NextResponse.next());
  }

  const adminToken = request.cookies.get('sb-auth-token')?.value;
  if (!adminToken) {
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    loginUrl.searchParams.set('from', pathname);
    return withLangCookie(request, NextResponse.redirect(loginUrl));
  }

  return withLangCookie(request, NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Static asset ve API hariç tüm sayfalar (dil cookie + auth).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
