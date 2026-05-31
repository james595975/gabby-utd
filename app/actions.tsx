'use server'

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// 1. Supabase 환경변수 검증 및 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. 이메일 데이터 인터페이스 정의
interface EmailData {
  type: string;
  name: string;
  email: string;
  phone: string;
  content: string;
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
  } catch (error: any) {
    console.error('Match score update error:', error);
    return { success: false, message: error.message || '스코어 업데이트 중 오류가 발생했습니다.' };
  }
}

/**
 * [기능 2] 하단 문의 폼 전송 시 구단 대표 메일로 알림을 쏴주는 서버 액션
 */
export async function sendInquiryEmail(data: EmailData) {
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

  const typeLabel = data.type === 'join' ? '🏆 입단 신청' : '✉️ 일반 문의';

  // 2. 관리자가 받아볼 메일 본문 구성 (HTML 스타일링 포함)
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: 'hjs595975@gmail.com', // ✨ 알림을 수신할 실제 구단 대표 이메일 주소로 변경하세요!
    subject: `[Gabby UTD] ${typeLabel} - ${data.name}님의 신청서가 접수되었습니다.`,
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
            <td style="padding: 10px 0; font-weight: 600;">${data.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">이메일 주소</td>
            <td style="padding: 10px 0;"><a href="mailto:${data.email}" style="color: #3b82f6; text-decoration: none;">${data.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">연락처</td>
            <td style="padding: 10px 0; font-weight: 600;">${data.phone}</td>
          </tr>
        </table>
        
        <div style="margin-top: 24px;">
          <p style="font-weight: bold; color: #6b7280; font-size: 14px; margin-bottom: 8px;">📝 신청 및 문의 내용</p>
          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6; font-size: 14px; color: #374151;">${data.content}</div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <p style="font-size: 11px; color: #9ca3af; margin: 0;">본 메일은 Gabby UTD 홈페이지 시스템에서 자동으로 발송된 관리자 알림 메일입니다.</p>
          <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">내용 검토 후 Supabase 관리자 페이지 또는 기재된 연락처를 통해 답변해 주세요.</p>
        </div>
      </div>
    `,
  };

  // 3. 메일 발송 수행
  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: '알림 메일이 성공적으로 발송되었습니다.' };
  } catch (error: any) {
    console.error('Nodemailer 전송 오류 발생:', error);
    return { 
      success: false, 
      message: error.message || '메일 서버 전송 중 예기치 못한 에러가 발생했습니다.' 
    };
  }
}