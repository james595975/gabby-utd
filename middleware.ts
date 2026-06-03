import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login은 Supabase Auth 로그인 페이지이므로 middleware에서 막지 않습니다.
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // /admin 및 /admin 하위 경로 보호
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminSession = request.cookies.get('admin_session')?.value;

    // 기존 admin_session 쿠키가 없는 경우 /admin이 아니라 /admin/login으로 보냅니다.
    // 실제 권한 검증은 /admin/page.tsx와 /admin/login/page.tsx의 Supabase Auth + admin_users 체크에서 수행합니다.
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const sessionData = JSON.parse(
        Buffer.from(adminSession, 'base64').toString('utf-8')
      );

      if (Date.now() > sessionData.expiry) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.delete('admin_session');
        return response;
      }

      return NextResponse.next();
    } catch (error) {
      console.error('세션 검증 오류:', error);
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
