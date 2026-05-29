'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// 파일 내부에 Supabase 연결 코드를 직접 박아넣습니다. (경로 에러 원천 차단)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function updateMatchScore(formData: FormData) {
  const matchId = formData.get('matchId') as string;
  const homeScore = parseInt(formData.get('homeScore') as string);
  const awayScore = parseInt(formData.get('awayScore') as string);
  const inputPassword = formData.get('password') as string;

  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  
  if (!inputPassword || inputPassword !== adminPassword) {
    return { success: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  const { error } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId);

  if (error) {
    console.error('Supabase 업데이트 실패:', error);
    return { success: false, message: 'DB 업데이트에 실패했습니다.' };
  }

  revalidatePath('/match');
  return { success: true, message: '성공적으로 수정되었습니다!' };
}