import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000;
const SESSION_MAX_AGE_SECONDS = 30 * 60;
const ADMIN_UID = process.env.ADMIN_USER_UID;

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIP = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0] || clientIP || 'unknown';
}

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
    loginAttempts.delete(ip);
  }

  return { allowed: true, message: '' };
}

function incrementAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (attempt && now - attempt.timestamp < LOCKOUT_TIME) {
    attempt.count++;
  } else {
    loginAttempts.set(ip, { count: 1, timestamp: now });
  }
}

function clearAttempt(ip: string): void {
  loginAttempts.delete(ip);
}

function createSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimitCheck = checkRateLimit(clientIP);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimitCheck.message },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      incrementAttempt(clientIP);
      return NextResponse.json(
        { success: false, message: '이메일과 비밀번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !loginData.user || !loginData.session) {
      incrementAttempt(clientIP);
      return NextResponse.json(
        { success: false, message: '로그인 정보가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    if (loginData.user.id !== ADMIN_UID) {
      incrementAttempt(clientIP);
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, message: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('uid')
      .eq('uid', loginData.user.id)
      .maybeSingle();

    const { data: legacyAdminUser, error: legacyAdminError } = adminUser
      ? { data: null, error: null }
      : await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', loginData.user.id)
        .maybeSingle();

    if ((adminError || !adminUser) && (legacyAdminError || !legacyAdminUser)) {
      incrementAttempt(clientIP);
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, message: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }

    clearAttempt(clientIP);

    const sessionToken = Buffer.from(
      JSON.stringify({
        authenticated: true,
        userId: loginData.user.id,
        timestamp: Date.now(),
        expiry: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      })
    ).toString('base64');

    const response = NextResponse.json(
      { success: true, message: '인증 성공' },
      { status: 200 }
    );

    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('관리자 인증 중 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
