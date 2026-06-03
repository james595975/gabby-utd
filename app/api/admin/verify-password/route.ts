import { NextRequest, NextResponse } from 'next/server';

// Rate limiting을 위한 메모리 저장소 (프로덕션에서는 Redis 사용 권장)
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5분

// 클라이언트 IP 추출
function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIP = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0] || clientIP || 'unknown';
}

// Rate limiting 확인
function checkRateLimit(ip: string): { allowed: boolean; message: string } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt && now - attempt.timestamp < LOCKOUT_TIME) {
    if (attempt.count >= MAX_ATTEMPTS) {
      return {
        allowed: false,
        message: `너무 많은 시도로 ${Math.ceil((LOCKOUT_TIME - (now - attempt.timestamp)) / 1000)}초 동안 잠겼습니다.`,
      };
    }
  } else {
    // 시간이 지나면 초기화
    loginAttempts.delete(ip);
  }

  return { allowed: true, message: '' };
}

// 시도 횟수 증가
function incrementAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt && now - attempt.timestamp < LOCKOUT_TIME) {
    attempt.count++;
  } else {
    loginAttempts.set(ip, { count: 1, timestamp: now });
  }
}

// 성공 시 시도 초기화
function clearAttempt(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  try {
    // ✅ Rate Limiting 검사
    const clientIP = getClientIP(request);
    const rateLimitCheck = checkRateLimit(clientIP);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimitCheck.message },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      incrementAttempt(clientIP);
      return NextResponse.json(
        { success: false, message: '비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // ✅ 서버 환경 변수에서 비밀번호 검증 (클라이언트에 노출 안 됨)
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password !== adminPassword) {
      incrementAttempt(clientIP);
      return NextResponse.json(
        { success: false, message: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // ✅ 비밀번호 일치 시 시도 초기화
    clearAttempt(clientIP);

    // ✅ 세션 토큰 생성
    const sessionToken = Buffer.from(
      JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
        expiry: Date.now() + 30 * 60 * 1000, // 30분
      })
    ).toString('base64');

    const response = NextResponse.json(
      { success: true, message: '인증 성공', sessionToken },
      { status: 200 }
    );

    // ✅ HttpOnly 쿠키 설정
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('비밀번호 검증 중 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}