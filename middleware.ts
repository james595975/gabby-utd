import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // ✅ /admin, /admin/* 경로 보호
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session')?.value;

    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin?unauthorized=true', request.url));
    }

    try {
      // ✅ 세션 토큰 검증
      const sessionData = JSON.parse(
        Buffer.from(adminSession, 'base64').toString('utf-8')
      );

      // ✅ 만료 시간 확인
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