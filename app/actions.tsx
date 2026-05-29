'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function updateMatchScore(formData: FormData) {
  const matchId = formData.get('matchId') as string;
  const homeScore = parseInt(formData.get('homeScore') as string);
  const awayScore = parseInt(formData.get('awayScore') as string);
  
  // ⚽ 어드민 입력창에서 받아올 로고 URL 데이터 추가
  const homeLogo = formData.get('homeLogo') as string;
  const awayLogo = formData.get('awayLogo') as string;
  
  const inputPassword = formData.get('password') as string;
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  
  if (!inputPassword || inputPassword !== adminPassword) {
    return { success: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  // ⚽ Supabase 'matches' 테이블에 로고 URL 컬럼도 함께 업데이트합니다.
  const { error } = await supabase
    .from('matches')
    .update({ 
      home_score: homeScore, 
      away_score: awayScore,
      home_logo: homeLogo, // Storage에서 복사한 주소가 들어감
      away_logo: awayLogo  // Storage에서 복사한 주소가 들어감
    })
    .eq('id', matchId);

  if (error) {
    console.error('Supabase 업데이트 실패:', error);
    return { success: false, message: 'DB 업데이트에 실패했습니다.' };
  }

  // 메인 페이지('/') 화면 갱신
  revalidatePath('/');
  return { success: true, message: '성공적으로 수정되었습니다!' };
}