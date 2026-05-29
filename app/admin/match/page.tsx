'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. 여기에 직접 Supabase 연결 코드를 박아서 경로 에러를 완전히 없앱니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. 어드민 페이지 내부에서 사용할 스코어 수정 서버 액션을 파일 안에 직접 정의합니다.
async function updateMatchScoreDirect(formData: FormData) {
  const matchId = formData.get('matchId') as string;
  const homeScore = parseInt(formData.get('homeScore') as string);
  const awayScore = parseInt(formData.get('awayScore') as string);
  const inputPassword = formData.get('password') as string;

  if (inputPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return { success: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  const { error } = await supabase
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId);

  if (error) return { success: false, message: 'DB 업데이트에 실패했습니다.' };
  return { success: true, message: '성공적으로 수정되었습니다!' };
}

interface Match {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
}

export default function AdminMatchPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [password, setPassword] = useState<string>('');

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('matches').select('*').order('id', { ascending: false });
    if (data && !error) setMatches(data);
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // 위에 정의한 내부 함수 실행
    const result = await updateMatchScoreDirect(formData);
    
    alert(result.message);
    if (result.success) {
      setSelectedMatchId(null);
      setPassword('');
      fetchMatches(); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">⚽ 계비 UTD 어드민</h1>
          <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-semibold">Admin Mode</span>
        </div>

        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl shadow-sm border p-4">
              {selectedMatchId !== match.id ? (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">{match.date || '최근 경기'}</span>
                    <span className="font-bold text-slate-800">{match.home_team} {match.home_score} : {match.away_score} {match.away_team}</span>
                  </div>
                  <button onClick={() => { setSelectedMatchId(match.id); setHomeScore(match.home_score); setAwayScore(match.away_score); }} className="bg-slate-100 text-xs font-bold py-1.5 px-3 rounded-lg">수정</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-emerald-50 p-4 rounded-xl border border-emerald-500">
                  <input type="hidden" name="matchId" value={match.id} />
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold">{match.home_team}</span>
                      <input type="number" name="homeScore" value={homeScore} onChange={(e)=>setHomeScore(Number(e.target.value))} className="w-12 text-center border rounded" />
                    </div>
                    <span>:</span>
                    <div className="flex items-center space-x-2">
                      <input type="number" name="awayScore" value={awayScore} onChange={(e)=>setAwayScore(Number(e.target.value))} className="w-12 text-center border rounded" />
                      <span className="text-xs font-bold">{match.away_team}</span>
                    </div>
                  </div>
                  <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="관리자 비밀번호" className="w-full px-3 py-1.5 text-xs border rounded mb-3 text-center" required />
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => setSelectedMatchId(null)} className="w-1/3 bg-slate-200 text-xs font-bold py-2 rounded-lg">취소</button>
                    <button type="submit" className="w-2/3 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg">저장</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}