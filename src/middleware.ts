import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 보호된 경로 목록
  const protectedRoutes = ['/', '/room', '/mypage'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 인증 페이지 목록
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 1. 비로그인 상태에서 보호된 페이지 접근 시 로그인 페이지로 리디렉션
  if (isProtectedRoute && !token) {
    const redirectUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
  }

  // 2. 이미 로그인된 상태에서 인증 페이지 접근 시 메인 페이지로 리디렉션
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/room/:path*', '/mypage/:path*', '/login', '/register'],
};
