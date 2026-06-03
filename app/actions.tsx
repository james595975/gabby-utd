'use server'

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// 1. Supabase 환경변수 검증 및 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 2. 이메일 데이터 인터페이스 정의
interface EmailData {
  type: string;
  name: string;
  email: string;
  phone: string;
  content: string;
  website?: string;
}

const MAX_FIELD_LENGTHS = {
  name: 40,
  email: 120,
  phone: 20,
  content: 1500,
};

const recentInquiryAttempts = new Map<string, number>();

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function validateInquiry(data: EmailData) {
  const clean = {
    type: data.type === 'join' ? 'join' : 'inquiry',
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    content: data.content.trim(),
  };

  if (data.website?.trim()) {
    return { ok: false as const, message: '요청을 처리할 수 없습니다.' };
  }

  if (!clean.name || !clean.email || !clean.phone || !clean.content) {
    return { ok: false as const, message: '필수 항목(*)을 모두 입력해 주세요.' };
  }

  if (clean.name.length > MAX_FIELD_LENGTHS.name || clean.email.length > MAX_FIELD_LENGTHS.email || clean.phone.length > MAX_FIELD_LENGTHS.phone || clean.content.length > MAX_FIELD_LENGTHS.content) {
    return { ok: false as const, message: '입력한 내용이 너무 깁니다. 내용을 조금 줄여주세요.' };
  }

  if (!/^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/.test(clean.name)) {
    return { ok: false as const, message: '이름 필드에는 문자(한글 또는 영문)만 입력할 수 있습니다.' };
  }

  if (!/^[0-9]+$/.test(clean.phone)) {
    return { ok: false as const, message: '연락처 필드에는 숫자만 입력할 수 있습니다.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    return { ok: false as const, message: '이메일 형식을 확인해 주세요.' };
  }

  const rateLimitKey = `${clean.email}:${clean.phone}`;
  const now = Date.now();
  const lastAttempt = recentInquiryAttempts.get(rateLimitKey);
  if (lastAttempt && now - lastAttempt < 60_000) {
    return { ok: false as const, message: '잠시 후 다시 전송해 주세요.' };
  }
  recentInquiryAttempts.set(rateLimitKey, now);

  return { ok: true as const, data: clean };
}

/**
 * [기능 1] 경기 스코어를 라이브로 업데이트하는 서버 액션
 */
export async function updateMatchScore(matchId: number, homeScore: number, awayScore: number) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', matchId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Match score update error:', error);
    return { success: false, message: getErrorMessage(error, '스코어 업데이트 중 오류가 발생했습니다.') };
  }
}

/**
 * [기능 2] 하단 문의 폼 전송 시 구단 대표 메일 알림 및 유저 자동 답장을 쏴주는 서버 액션
 */
export async function sendInquiryEmail(data: EmailData) {
  const validation = validateInquiry(data);
  if (!validation.ok) {
    return {
      success: false,
      message: validation.message,
    };
  }

  const inquiry = validation.data;

  // 환경변수 체크 (Nodemailer 설정 미비 시 에러 방지)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('SMTP 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
    return { 
      success: false, 
      message: '서버 메일 설정(SMTP_USER, SMTP_PASSWORD)이 누락되었습니다.' 
    };
  }

  // 1. 메일을 발송할 SMTP Transporter 설정 (Gmail 기준)
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.SMTP_USER,     // 보내는 사람 Gmail 계정
      pass: process.env.SMTP_PASSWORD, // 구글 계정에서 발급받은 16자리 앱 비밀번호
    },
  });

  const { error: dbError } = await supabase
    .from('messages')
    .insert([
      {
        type: inquiry.type,
        name: inquiry.name,
        content: `[이메일: ${inquiry.email} / 연락처: ${inquiry.phone}]\n\n내용:\n${inquiry.content}`,
      },
    ]);

  if (dbError) {
    console.error('Inquiry DB insert error:', dbError);
    return {
      success: false,
      message: '데이터베이스 저장에 실패했습니다.',
    };
  }

  const typeLabel = inquiry.type === 'join' ? '🏆 입단 신청' : '✉️ 일반 문의';
  const safeName = escapeHtml(inquiry.name);
  const safeEmail = escapeHtml(inquiry.email);
  const safePhone = escapeHtml(inquiry.phone);
  const safeContent = escapeHtml(inquiry.content);
  const safeTypeLabel = escapeHtml(typeLabel);

  // 2. [구단 관리자용] 관리자가 받아볼 메일 본문 구성 (HTML 스타일링 포함)
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.SMTP_USER, // ✨ 알림을 수신할 실제 구단 대표 이메일 주소
    subject: `[Gabby UTD] ${typeLabel} - ${inquiry.name}님의 신청서가 접수되었습니다.`,
    html: `
      <div style="font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 24px; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <div style="background-color: #4a1525; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">⚽ Gabby UTD 온라인 접수 안내</h2>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280; width: 100px;">접수 구분</td>
            <td style="padding: 10px 0; font-weight: bold; color: #4a1525;">${safeTypeLabel}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">신청자 이름</td>
            <td style="padding: 10px 0; font-weight: 600;">${safeName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">이메일 주소</td>
            <td style="padding: 10px 0;"><a href="mailto:${safeEmail}" style="color: #3b82f6; text-decoration: none;">${safeEmail}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">연락처</td>
            <td style="padding: 10px 0; font-weight: 600;">${safePhone}</td>
          </tr>
        </table>
        
        <div style="margin-top: 24px;">
          <p style="font-weight: bold; color: #6b7280; font-size: 14px; margin-bottom: 8px;">📝 신청 및 문의 내용</p>
          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #374151;">${safeContent}</div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">본 메일은 Gabby UTD 홈페이지 시스템에서 자동으로 발송된 관리자 알림 메일입니다.</p>
          <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">내용 검토 후 Supabase 관리자 페이지 또는 기재된 연락처를 통해 답변해 주세요.</p>
        </div>
      </div>
    `,
  };

  // 3. ✨ [유저 자동 답장용] 템플릿 구성
  const autoReplyHtml = `
    <div style="background-color: #f9f9f9; padding: 40px 20px; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e1e1;">
        
        <div style="background-color: #4a1525; padding: 35px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px;">Gabby UTD</h1>
          <p style="margin: 6px 0 0 0; color: #d4af37; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">열정과 함께, 끝까지 승리를 위하여</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #111;">안녕하세요, ${safeName}님.</p>
          <p style="font-size: 14px; color: #555; margin-bottom: 25px;">
            Gabby UTD 구단 홈페이지를 통해 주신 소중한 <strong>${safeTypeLabel}</strong>이 정상적으로 접수되었습니다.
          </p>
          
          <div style="background-color: #fcf8f9; border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 6px; border: 1px solid #f5e6e8; border-left-width: 4px;">
            <p style="margin: 0; font-size: 15px; font-weight: 800; color: #4a1525; letter-spacing: -0.5px;">
              📢 잠시만 기다려주세요. 팀 내부에서 논의 후 알려드리겠습니다.
            </p>
          </div>
          
          <div style="margin-top: 35px; border-top: 1px solid #eee; padding-top: 25px;">
            <h3 style="font-size: 14px; color: #222; margin-top: 0; margin-bottom: 12px; font-weight: bold;">[접수 확인 내역]</h3>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse; color: #555;">
              <tr>
                <td style="width: 90px; padding: 6px 0; font-weight: bold; color: #888;">문의 유형</td>
                <td style="padding: 6px 0; font-weight: bold; color: #4a1525;">${safeTypeLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #888;">신청자명</td>
                <td style="padding: 6px 0;">${safeName}님</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #888;">연락처</td>
                <td style="padding: 6px 0; font-family: monospace;">${safePhone}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="background-color: #210810; padding: 25px; text-align: center; color: #a5828d; font-size: 11px; border-top: 1px solid rgba(255,255,255,0.05);">
          <p style="margin: 0; font-weight: bold;">⚠️ 본 메일은 시스템에 의해 발송된 발신 전용 메일입니다.</p>
          <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.4);">© 2026 Gabby UTD. All rights reserved.</p>
        </div>
        
      </div>
    </div>
  `;

  // 4. 메일 발송 수행 (관리자 알림 -> 유저 안내)
  try {
    // 4-1. 관리자에게 먼저 알림 발송
    await transporter.sendMail(mailOptions);
    
    // 4-2. 유저에게 자동 안내 메일 발송
    await transporter.sendMail({
      from: `"Gabby UTD" <${process.env.SMTP_USER}>`, 
      to: inquiry.email, // 유저가 입력한 이메일 주소
      subject: `[Gabby UTD] 신청하신 내용이 정상적으로 접수되었습니다.`,
      html: autoReplyHtml,
    });

    return { success: true, message: '알림 및 자동 답장 메일이 성공적으로 발송되었습니다.' };
  } catch (error: unknown) {
    console.error('Nodemailer 전송 오류 발생:', error);
    return { 
      success: false, 
      message: getErrorMessage(error, '메일 서버 전송 중 예기치 못한 에러가 발생했습니다.') 
    };
  }
}
