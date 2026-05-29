'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// 🚨 app/actions.ts 위치에 맞게 위로 2번(../../) 올라가는 경로로 수정 완료!
import { updateMatchScore } from '../../actions'; 

// 내부에 직접 Supabase 연결 코드를 박아서 클라이언트 조회 경로 에러 방지
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Match {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_logo?: string;
  away_logo?: string;
}

export default function AdminMatchPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  // 수정 입력 폼 상태 관리
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [homeLogo, setHomeLogo] = useState<string>('');
  const [awayLogo, setAwayLogo] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('id', { ascending: false });
    
    if (data && !error) setMatches(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchMatches(); 
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // 서버 액션 함수 실행 (점수 + 로고 URL 전송)
    const result = await updateMatchScore(formData);
    
    alert(result.message);
    if (result.success) {
      setSelectedMatchId(null);
      setPassword('');
      fetchMatches(); // 수정 완료 후 데이터 새로고침
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 bg-slate-50">로딩 중...</div>;

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
                // 1. 경기 목록 모드
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {/* 홈팀 로고 */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                      {match.home_logo ? <img src={match.home_logo} className="w-full h-full object-cover" /> : <span>⚽</span>}
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">{match.date || '최근 경기'}</span>
                      <span className="font-bold text-slate-800">
                        {match.home_team} {match.home_score} : {match.away_score} {match.away_team}
                      </span>
                    </div>
                    {/* 원정팀 로고 */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                      {match.away_logo ? <img src={match.away_logo} className="w-full h-full object-cover" /> : <span>⚽</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      setSelectedMatchId(match.id); 
                      setHomeScore(match.home_score); 
                      setAwayScore(match.away_score);
                      setHomeLogo(match.home_logo || '');
                      setAwayLogo(match.away_logo || '');
                    }} 
                    className="bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-slate-700"
                  >
                    수정
                  </button>
                </div>
              ) : (
                // 2. 경기 수정 양식 모드 (점수 + 로고 URL 수정 폼 추가 완료)
                <form onSubmit={handleSubmit} className="bg-emerald-50 p-4 rounded-xl border border-emerald-500 space-y-4">
                  <input type="hidden" name="matchId" value={match.id} />
                  
                  {/* 스코어 입력 */}
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-700">{match.home_team}</span>
                      <input type="number" name="homeScore" value={homeScore} onChange={(e)=>setHomeScore(Number(e.target.value))} className="w-12 text-center border rounded p-1 text-black font-bold" />
                    </div>
                    <span className="font-bold text-slate-400">:</span>
                    <div className="flex items-center space-x-2">
                      <input type="number" name="awayScore" value={awayScore} onChange={(e)=>setAwayScore(Number(e.target.value))} className="w-12 text-center border rounded p-1 text-black font-bold" />
                      <span className="text-xs font-bold text-slate-700">{match.away_team}</span>
                    </div>
                  </div>

                  {/* ⭐️ 로고 URL 입력부 신설 */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-600 font-bold block mb-1">🏠 홈팀 로고 URL (Supabase Storage 주소)</label>
                      <input 
                        type="text" 
                        name="homeLogo" 
                        value={homeLogo}
                        onChange={(e)=>setHomeLogo(e.target.value)}
                        placeholder="https://xxxx.supabase.co/storage/v1/object/public/logos/..." 
                        className="w-full px-3 py-1.5 text-xs bg-white border rounded text-slate-800 focus:outline-emerald-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 font-bold block mb-1">🏃 원정팀 로고 URL (Supabase Storage 주소)</label>
                      <input 
                        type="text" 
                        name="awayLogo" 
                        value={awayLogo}
                        onChange={(e)=>setAwayLogo(e.target.value)}
                        placeholder="https://xxxx.supabase.co/storage/v1/object/public/logos/..." 
                        className="w-full px-3 py-1.5 text-xs bg-white border rounded text-slate-800 focus:outline-emerald-500" 
                      />
                    </div>
                  </div>

                  {/* 비밀번호 입력 */}
                  <div>
                    <input 
                      type="password" 
                      name="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="관리자 비밀번호 입력" 
                      className="w-full px-3 py-2 text-xs bg-white border rounded text-center text-black font-bold focus:outline-emerald-500" 
                      required 
                    />
                  </div>

                  {/* 제어 버튼 */}
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => setSelectedMatchId(null)} className="w-1/3 bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg">취소</button>
                    <button type="submit" className="w-2/3 bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-emerald-700">저장</button>
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