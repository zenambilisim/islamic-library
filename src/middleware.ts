import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { USER_AUTH_COOKIE } from '@/lib/auth-constants';

const ADMIN_LOGIN = '/admin/login';
const USER_LOGIN = '/user/login';

/**
 * /admin/* — yönetici oturumu (sb-auth-token)
 * /library — okuyucu oturumu (sb-user-token)
 * /user/login — giriş yapmış okuyucuyu kütüphaneye yönlendir
 *
 * Dil (il_lang) cookie’sine burada varsayılan basılmaz — client
 * setLanguageCookie / localStorage ile yazar. Middleware’in tr yazması
 * kayıtlı tercihi eziyordu.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userToken = request.cookies.get(USER_AUTH_COOKIE)?.value;

  if (pathname === USER_LOGIN) {
    if (userToken) {
      return NextResponse.redirect(new URL('/library', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/library' || pathname.startsWith('/user/profile')) {
    if (!userToken) {
      const loginUrl = new URL(USER_LOGIN, request.url);
      loginUrl.searchParams.set('from', pathname === '/library' ? '/library' : '/user/profile');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

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

export const config = {
  matcher: [
    /*
     * Static asset hariç sayfalar (auth koruması).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
