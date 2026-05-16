import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_LOGIN = '/admin/login';

/**
 * /admin/* rotalarını korur. Giriş yapmamış kullanıcıyı /admin/login'e yönlendirir.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/user')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/user/, '/admin');
    return NextResponse.redirect(url);
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

  const token = request.cookies.get('sb-auth-token')?.value;
  if (!token) {
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/user/:path*'],
};
