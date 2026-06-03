import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ 1. /admin 경로는 로그인 페이지이므로 인증 검사에서 제외합니다.
  // /admin/dashboard, /admin/settings 등 하위 경로만 보호합니다.
  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    const adminSession = request.cookies.get('admin_session')?.value;

    // ✅ 2. 세션이 아예 없는 경우 바로 리디렉션 (불필요한 Buffer.from 에러 방지)
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin?invalid_session=true', request.url));
    }

    try {
      // 세션 토큰 검증
      const sessionData = JSON.parse(
        Buffer.from(adminSession, 'base64').toString('utf-8')
      );

      // 만료 시간 확인
      if (Date.now() > sessionData.expiry) {
        const response = NextResponse.redirect(
          new URL('/admin?session_expired=true', request.url)
        );
        response.cookies.delete('admin_session');
        return response;
      }

      return NextResponse.next();
    } catch (error) {
      console.error('세션 검증 오류:', error);
      return NextResponse.redirect(new URL('/admin?invalid_session=true', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
