import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { USER_AUTH_COOKIE } from '@/lib/auth-constants';
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  getLocaleFromPathname,
  isSupportedLanguage,
  localizedPath,
  normalizeLanguage,
  stripLocaleFromPathname,
  type SupportedLanguage,
} from '@/lib/locale';

const ADMIN_LOGIN = '/admin/login';
const USER_LOGIN = '/user/login';

const SKIP_LOCALE_PREFIXES = [
  '/admin',
  '/api',
  '/user',
  '/_next',
  '/sitemap',
  '/robots',
];

function shouldSkipLocale(pathname: string): boolean {
  if (pathname === '/favicon.ico') return true;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return SKIP_LOCALE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function resolveRedirectLocale(request: NextRequest): SupportedLanguage {
  const cookieLang = request.cookies.get(LANG_COOKIE)?.value;
  const fromCookie = cookieLang ? normalizeLanguage(cookieLang) : null;
  const fromQuery = request.nextUrl.searchParams.get('lang');
  if (fromQuery && isSupportedLanguage(fromQuery.trim().toLowerCase())) {
    return fromQuery.trim().toLowerCase() as SupportedLanguage;
  }
  return fromCookie ?? DEFAULT_LANG;
}

function withLangCookie(response: NextResponse, locale: SupportedLanguage): NextResponse {
  response.cookies.set(LANG_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return response;
}

/**
 * /admin/* — yönetici oturumu (sb-auth-token)
 * /[locale]/library — okuyucu oturumu (sb-user-token)
 * /user/login — giriş yapmış okuyucuyu kütüphaneye yönlendir
 *
 * Public path'lere locale öneki ekler; il_lang cookie'yi URL ile senkronize eder.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userToken = request.cookies.get(USER_AUTH_COOKIE)?.value;

  if (pathname === USER_LOGIN) {
    if (userToken) {
      const cookieLang = normalizeLanguage(request.cookies.get(LANG_COOKIE)?.value);
      return NextResponse.redirect(
        new URL(localizedPath(cookieLang, '/library'), request.url)
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/user/profile')) {
    if (!userToken) {
      const loginUrl = new URL(USER_LOGIN, request.url);
      loginUrl.searchParams.set('from', '/user/profile');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === ADMIN_LOGIN) {
      if (request.cookies.get('sb-auth-token')?.value) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.next();
    }

    const adminToken = request.cookies.get('sb-auth-token')?.value;
    if (!adminToken) {
      const loginUrl = new URL(ADMIN_LOGIN, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (shouldSkipLocale(pathname)) {
    return NextResponse.next();
  }

  const pathLocale = getLocaleFromPathname(pathname);

  if (!pathLocale) {
    const locale = resolveRedirectLocale(request);
    const barePath = pathname === '/' ? '/' : pathname;
    const targetPath = localizedPath(locale, barePath);
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    // Migrate ?lang= into path locale; drop the query param
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
    }
    return withLangCookie(NextResponse.redirect(url, 308), locale);
  }

  // Valid locale prefix: sync cookie, then auth for library
  const bare = stripLocaleFromPathname(pathname);
  let response = NextResponse.next();

  const cookieLang = request.cookies.get(LANG_COOKIE)?.value;
  if (normalizeLanguage(cookieLang) !== pathLocale) {
    response = withLangCookie(response, pathLocale);
  }

  if (bare === '/library') {
    if (!userToken) {
      const loginUrl = new URL(USER_LOGIN, request.url);
      loginUrl.searchParams.set('from', localizedPath(pathLocale, '/library'));
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
