'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function updateMatchScore(formData: FormData) {
  const password = formData.get('password') as string;
  const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (password !== correctPassword) {
    return { success: false, message: '인증 권한이 없습니다.' };
  }

  const matchId = formData.get('matchId'); 
  const homeScore = formData.get('homeScore');
  const awayScore = formData.get('awayScore');
  const homeLogo = formData.get('homeLogo') as string;
  const awayLogo = formData.get('awayLogo') as string;
  const recentForm = formData.get('recentForm') as string; 

  if (!matchId) {
    return { success: false, message: '매치 ID가 누락되었습니다.' };
  }

  try {
    // 🚨 스크린샷 팩트 체크 완료: id 컬럼에 다이렉트로 할당 연동
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: Number(homeScore),
        away_score: Number(awayScore),
        home_logo: homeLogo || null,
        away_logo: awayLogo || null,
        recent_form: recentForm || 'W,W,L,W,D'
      })
      .eq('id', Number(matchId)); 

    if (error) {
      console.error('Supabase 업데이트 실패:', error.message);
      return { success: false, message: `DB 반영 실패: ${error.message}` };
    }

    return { success: true, message: '⚽ 경기 정보 및 로고 주소가 성공적으로 수정되었습니다!' };
  } catch (err: any) {
    return { success: false, message: `서버 오류: ${err.message}` };
  }
}