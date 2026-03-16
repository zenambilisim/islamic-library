import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USER_LOGIN = '/user/login';

/**
 * /user/* rotalarını korur. Giriş yapmamış kullanıcıyı /user/login'e yönlendirir.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/user')) {
    return NextResponse.next();
  }

  if (pathname === USER_LOGIN) {
    if (request.cookies.get('sb-auth-token')?.value) {
      return NextResponse.redirect(new URL('/user/dashboard', request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get('sb-auth-token')?.value;
  if (!token) {
    const loginUrl = new URL(USER_LOGIN, request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*'],
};
