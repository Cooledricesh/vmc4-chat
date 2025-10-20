import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  console.log('[Middleware]', { pathname, hasToken: !!token, tokenLength: token?.length });

  // 로그인/회원가입 페이지에 이미 로그인된 상태로 접근 시
  if (token && (pathname === '/login' || pathname === '/register')) {
    console.log('[Middleware] Logged in user accessing auth page, redirecting to /');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 보호된 페이지에 비로그인 상태로 접근 시
  const isProtectedPath =
    pathname === '/' ||
    pathname.startsWith('/room') ||
    pathname.startsWith('/mypage') ||
    pathname.startsWith('/dashboard');

  console.log('[Middleware]', { isProtectedPath });

  if (!token && isProtectedPath) {
    console.log('[Middleware] No token, redirecting to login');
    const redirectUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
  }

  console.log('[Middleware] Allowing request');
  return NextResponse.next();
}

export const config = {
  // API 라우트와 정적 파일은 제외
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
