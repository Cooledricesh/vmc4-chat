import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 로그인/회원가입 페이지에 이미 로그인된 상태로 접근 시
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 보호된 페이지에 비로그인 상태로 접근 시
  const protectedPaths = ['/', '/room', '/mypage'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (!token && isProtectedPath) {
    const redirectUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/room/:path*', '/mypage'],
};
