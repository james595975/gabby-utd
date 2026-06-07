'use server'

import { createClient as createSupabaseServerClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';

interface EmailData {
  type: string;
  name: string;
  email: string;
  phone: string;
  content: string;
}

const ALLOWED_INQUIRY_TYPES = ['join', 'inquiry'] as const;
const MAX_NAME_LENGTH = 30;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 20;
const MAX_CONTENT_LENGTH = 1000;
const ADMIN_UID = process.env.ADMIN_USER_UID || 'c348daeb-51f9-4347-a3b9-6470085ef190';
const TESTMAIL_SMTP_HOST = process.env.TESTMAIL_SMTP_HOST || 'smtp.testmail.app';
const TESTMAIL_SMTP_PORT = Number(process.env.TESTMAIL_SMTP_PORT || 587);
const TESTMAIL_SMTP_SECURE = process.env.TESTMAIL_SMTP_SECURE === 'true' || TESTMAIL_SMTP_PORT === 465;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sanitizeEmailData(data: EmailData) {
  const type = data.type?.trim();
  const name = data.name?.trim();
  const email = data.email?.trim();
  const phone = data.phone?.trim();
  const content = data.content?.trim();

  const nameRegex = /^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]+$/;

  if (!ALLOWED_INQUIRY_TYPES.includes(type as (typeof ALLOWED_INQUIRY_TYPES)[number])) {
    return { success: false as const, message: '잘못된 문의 유형입니다.' };
  }

  if (!name || !email || !phone || !content) {
    return { success: false as const, message: '필수 항목을 모두 입력해 주세요.' };
  }

  if (name.length > MAX_NAME_LENGTH || !nameRegex.test(name)) {
    return { success: false as const, message: '이름 형식이 올바르지 않습니다.' };
  }

  if (email.length > MAX_EMAIL_LENGTH || !emailRegex.test(email)) {
    return { success: false as const, message: '이메일 형식이 올바르지 않습니다.' };
  }

  if (phone.length > MAX_PHONE_LENGTH || !phoneRegex.test(phone)) {
    return { success: false as const, message: '연락처 형식이 올바르지 않습니다.' };
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return { success: false as const, message: `문의 내용은 ${MAX_CONTENT_LENGTH}자 이하로 입력해 주세요.` };
  }

  return {
    success: true as const,
    data: {
      type,
      name,
      email,
      phone,
      content,
    },
  };
}

async function verifyAdminUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isAdmin: false, supabase };
  }

  if (user.id !== ADMIN_UID) {
    return { isAdmin: false, supabase };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('uid')
    .eq('uid', user.id)
    .maybeSingle();

  if (!adminError && adminUser) {
    return { isAdmin: true, supabase };
  }

  const { data: legacyAdminUser, error: legacyAdminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!legacyAdminError && legacyAdminUser) {
    return { isAdmin: true, supabase };
  }

  return { isAdmin: false, supabase };
}

/**
 * [기능 1] 경기 스코어를 라이브로 업데이트하는 서버 액션
 */
export async function updateMatchScore(matchId: number, homeScore: number, awayScore: number) {
  try {
    const { isAdmin, supabase } = await verifyAdminUser();

    if (!isAdmin) {
      return { success: false, message: '관리자 권한이 필요합니다.' };
    }

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return { success: false, message: '경기 ID가 올바르지 않습니다.' };
    }

    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      return { success: false, message: '점수 형식이 올바르지 않습니다.' };
    }

    if (homeScore < 0 || awayScore < 0 || homeScore > 99 || awayScore > 99) {
      return { success: false, message: '점수 범위가 올바르지 않습니다.' };
    }

    const { data, error } = await supabase
      .from('matches')
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', matchId)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Match score update error:', error);
    return { success: false, message: '스코어 업데이트 중 오류가 발생했습니다.' };
  }
}

/**
 * [기능 2] 하단 문의 폼 전송 시 구단 대표 메일 알림 및 유저 자동 답장을 쏴주는 서버 액션
 */
export async function sendInquiryEmail(data: EmailData) {
  const validated = sanitizeEmailData(data);

  if (!validated.success) {
    return validated;
  }

  const safeData = {
    type: validated.data.type,
    name: escapeHtml(validated.data.name),
    email: escapeHtml(validated.data.email),
    phone: escapeHtml(validated.data.phone),
    content: escapeHtml(validated.data.content),
  };

  if (!process.env.TESTMAIL_SMTP_USER || !process.env.TESTMAIL_SMTP_PASSWORD) {
    console.error('Testmail SMTP 환경변수가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.');
    return { 
      success: false, 
      message: '서버 메일 설정이 누락되었습니다.' 
    };
  }

  const fromAddress = process.env.TESTMAIL_FROM_EMAIL || process.env.TESTMAIL_SMTP_USER;
  const notificationAddress = process.env.INQUIRY_NOTIFICATION_EMAIL || fromAddress;

  const transporter = nodemailer.createTransport({
    host: TESTMAIL_SMTP_HOST,
    port: TESTMAIL_SMTP_PORT,
    secure: TESTMAIL_SMTP_SECURE,
    auth: {
      user: process.env.TESTMAIL_SMTP_USER,
      pass: process.env.TESTMAIL_SMTP_PASSWORD,
    },
  });

  const typeLabel = safeData.type === 'join' ? '🏆 입단 신청' : '✉️ 일반 문의';

  const mailOptions = {
    from: `"Gabby UTD" <${fromAddress}>`,
    to: notificationAddress,
    replyTo: validated.data.email,
    subject: `[Gabby UTD] ${typeLabel} - ${safeData.name}님의 신청서가 접수되었습니다.`,
    html: `
      <div style="font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 24px; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <div style="background-color: #4a1525; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: #d4af37; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">⚽ Gabby UTD 온라인 접수 안내</h2>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280; width: 100px;">접수 구분</td>
            <td style="padding: 10px 0; font-weight: bold; color: #4a1525;">${typeLabel}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">신청자 이름</td>
            <td style="padding: 10px 0; font-weight: 600;">${safeData.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">이메일 주소</td>
            <td style="padding: 10px 0;"><a href="mailto:${safeData.email}" style="color: #3b82f6; text-decoration: none;">${safeData.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">연락처</td>
            <td style="padding: 10px 0; font-weight: 600;">${safeData.phone}</td>
          </tr>
        </table>
        
        <div style="margin-top: 24px;">
          <p style="font-weight: bold; color: #6b7280; font-size: 14px; margin-bottom: 8px;">📝 신청 및 문의 내용</p>
          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #374151;">${safeData.content}</div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">본 메일은 Gabby UTD 홈페이지 시스템에서 자동으로 발송된 관리자 알림 메일입니다.</p>
          <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">내용 검토 후 Supabase 관리자 페이지 또는 기재된 연락처를 통해 답변해 주세요.</p>
        </div>
      </div>
    `,
  };

  const autoReplyHtml = `
    <div style="background-color: #f9f9f9; padding: 40px 20px; font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; color: #333; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e1e1;">
        
        <div style="background-color: #4a1525; padding: 35px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px;">Gabby UTD</h1>
          <p style="margin: 6px 0 0 0; color: #d4af37; font-size: 13px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">열정과 함께, 끝까지 승리를 위하여</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #ffffff;">
          <p style="font-size: 16px; font-weight: bold; margin-top: 0; color: #111;">안녕하세요, ${safeData.name}님.</p>
          <p style="font-size: 14px; color: #555; margin-bottom: 25px;">
            Gabby UTD 구단 홈페이지를 통해 주신 소중한 <strong>${typeLabel}</strong>이 정상적으로 접수되었습니다.
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
                <td style="padding: 6px 0; font-weight: bold; color: #4a1525;">${typeLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #888;">신청자명</td>
                <td style="padding: 6px 0;">${safeData.name}님</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #888;">연락처</td>
                <td style="padding: 6px 0; font-family: monospace;">${safeData.phone}</td>
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

  try {
    await transporter.sendMail(mailOptions);
    
    await transporter.sendMail({
      from: `"Gabby UTD" <${fromAddress}>`,
      to: validated.data.email,
      subject: `[Gabby UTD] 신청하신 내용이 정상적으로 접수되었습니다.`,
      html: autoReplyHtml,
    });

    return { success: true, message: '알림 및 자동 답장 메일이 성공적으로 발송되었습니다.' };
  } catch (error) {
    console.error('Nodemailer 전송 오류 발생:', error);
    return { 
      success: false, 
      message: '메일 서버 전송 중 오류가 발생했습니다.' 
    };
  }
}
