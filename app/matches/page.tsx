'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

interface MatchData {
  id: number;
  home_team?: string;
  away_team?: string;
  home_score: number;
  away_score: number;
  home_logo?: string;
  away_logo?: string;
  date?: string; // 📅 어드민에서 입력한 date 필드 복구
  is_practice?: boolean;
  match_result?: string;
}

interface GoalData {
  id: number;
  match_id: number;
  scorer_name: string;
  minute?: number | null;
  team: 'home' | 'away';
  note?: string | null;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [typeFilter, setTypeFilter] = useState<'all' | 'official' | 'practice'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'draw' | 'lose'>('all');

  const DEFAULT_HOME_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/home_icon/home_icon.jpg'; 
  const DEFAULT_AWAY_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg'; 

  async function fetchMatches() {
    try {
      setLoading(true);
      const [matchesResult, goalsResult] = await Promise.all([
        supabase.from('matches').select('*').order('id', { ascending: false }),
        supabase.from('match_goals').select('*').order('minute', { ascending: true, nullsFirst: false }).order('id', { ascending: true }),
      ]);

      if (!matchesResult.error && matchesResult.data) setMatches(matchesResult.data);
      if (!goalsResult.error && goalsResult.data) setGoals(goalsResult.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMatches();
  }, []);

  const totalMatches = matches.length;
  const wins = matches.filter(m => m.match_result === '승리').length;
  const draws = matches.filter(m => m.match_result === '무승부').length;
  const loses = matches.filter(m => m.match_result === '패배').length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const filteredMatches = matches.filter((m) => {
    if (typeFilter === 'official' && m.is_practice) return false;
    if (typeFilter === 'practice' && !m.is_practice) return false;

    if (resultFilter === 'win' && m.match_result !== '승리') return false;
    if (resultFilter === 'draw' && m.match_result !== '무승부') return false;
    if (resultFilter === 'lose' && m.match_result !== '패배') return false;

    return true;
  });

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans antialiased pb-20 relative overflow-hidden">
      
      {/* 🌌 배경 빛 번짐 효과 (좌상단 블루, 우하단 핑크 고정) */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#1a233a]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#3b1028]/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* 📌 최상단 네비게이션 바 */}
      <nav className="border-b border-gray-800/50 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-black text-lg tracking-wider text-white hover:text-[#f2d272] transition-colors flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={DEFAULT_HOME_LOGO} 
              alt="Gabby UTD Mini Logo" 
              className="w-6 h-6 object-contain rounded-full bg-black/20 p-0.5"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://gyebi-utd-logo-url-here.png'; }} 
            />
            <span>Gabby UTD</span>
          </Link>
          <div className="flex gap-5 text-xs sm:text-sm font-bold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">메인 홈</Link>
            <Link href="/matches" className="text-[#f2d272] border-b-2 border-[#f2d272] pb-1">MATCHES</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-10 space-y-6 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <span className="inline-block w-3 h-7 bg-gradient-to-b from-[#1a233a] to-[#3b1028] rounded-sm"></span>
            구단 역대 경기 기록실
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 pl-5 tracking-wide">Gabby UTD 역대 매치 아카이브입니다.</p>
        </div>

        {/* 📊 대시보드 스코어 (미드나잇 블루 & 네온 핑크 크로스 그라데이션) */}
        <div className="grid grid-cols-4 bg-gradient-to-r from-[#1a233a]/40 via-[#0a0a0a] to-[#3b1028]/40 border border-gray-700/50 backdrop-blur-sm rounded-2xl p-5 text-center divide-x divide-gray-700/50 shadow-2xl">
          <div>
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold tracking-widest">총 경기수</p>
            <p className="text-lg sm:text-2xl font-black mt-1 text-white">{totalMatches}<span className="text-xs font-normal text-gray-400 ml-0.5">전</span></p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-green-400 font-bold tracking-widest">승리</p>
            <p className="text-lg sm:text-2xl font-black mt-1 text-green-400 shadow-green-500/20 drop-shadow-lg">{wins}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-400 font-bold tracking-widest">무 / 패</p>
            <p className="text-lg sm:text-2xl font-black mt-1 text-gray-300">{draws}<span className="text-[10px] font-normal text-gray-500 mx-1">무</span>{loses}<span className="text-[10px] font-normal text-gray-500 ml-0.5">패</span></p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-[#f2d272] font-bold tracking-widest">승률</p>
            <p className="text-lg sm:text-2xl font-black mt-1 text-[#f2d272]">{winRate}<span className="text-xs font-normal ml-0.5">%</span></p>
          </div>
        </div>

        {/* 🔍 필터 탭 */}
        <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/60 rounded-xl p-3 flex flex-wrap gap-4 items-center justify-between text-xs font-bold text-gray-400 shadow-lg">
          <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-gray-800">
            <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-md transition-all ${typeFilter === 'all' ? 'bg-[#f2d272] text-black shadow-md font-black' : 'hover:text-white'}`}>전체</button>
            <button onClick={() => setTypeFilter('official')} className={`px-3 py-1.5 rounded-md transition-all ${typeFilter === 'official' ? 'bg-[#f2d272] text-black shadow-md font-black' : 'hover:text-white'}`}>공식전</button>
            <button onClick={() => setTypeFilter('practice')} className={`px-3 py-1.5 rounded-md transition-all ${typeFilter === 'practice' ? 'bg-[#f2d272] text-black shadow-md font-black' : 'hover:text-white'}`}>친선전</button>
          </div>

          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-gray-800 text-[11px]">
            <button onClick={() => setResultFilter('all')} className={`px-2.5 py-1 rounded transition-all ${resultFilter === 'all' ? 'bg-white text-black font-black' : 'hover:text-white'}`}>전체결과</button>
            <button onClick={() => setResultFilter('win')} className={`px-2.5 py-1 rounded transition-all ${resultFilter === 'win' ? 'bg-green-500 text-white font-black shadow-lg' : 'hover:text-white'}`}>승리</button>
            <button onClick={() => setResultFilter('draw')} className={`px-2.5 py-1 rounded transition-all ${resultFilter === 'draw' ? 'bg-gray-600 text-white font-black' : 'hover:text-white'}`}>무승부</button>
            <button onClick={() => setResultFilter('lose')} className={`px-2.5 py-1 rounded transition-all ${resultFilter === 'lose' ? 'bg-red-500 text-white font-black shadow-lg' : 'hover:text-white'}`}>패배</button>
          </div>
        </div>

        {/* 📜 리스트 */}
        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-500">매치 데이터를 분석 중입니다...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-500 bg-[#0a0a0a] border border-dashed border-gray-700/50 rounded-2xl">조회된 매치 결과가 없습니다.</div>
          ) : (
            filteredMatches.map((match) => {
              const currentHomeLogo = match.home_logo && match.home_logo.startsWith('http') ? match.home_logo : DEFAULT_HOME_LOGO;
              const currentAwayLogo = match.away_logo && match.away_logo.startsWith('http') ? match.away_logo : DEFAULT_AWAY_LOGO;
              
              // ⚙️ 어드민 입력값을 그대로 쓰고, 비어있을 때만 기본 텍스트 처리
              const displayDate = match.date ? match.date.trim() : '날짜 미지정';

              return (
                <article key={match.id} className="group bg-[#0a0a0a] border border-gray-800/60 rounded-2xl shadow-lg hover:border-gray-500/50 hover:bg-[#111] transition-all duration-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSelectedMatchId(selectedMatchId === match.id ? null : match.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center gap-x-3 min-w-[100px]">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded text-center border w-fit shadow-sm ${
                      match.match_result === '승리' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                      match.match_result === '패배' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      'bg-gray-700/20 text-gray-300 border-gray-600/30'
                    }`}>
                      {match.match_result || '무승부'}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded w-fit border ${
                      match.is_practice ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {match.is_practice ? '친선 매치' : '공식 매치'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono font-bold block sm:inline mt-1 sm:mt-0">
                      🗓️ {displayDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 flex-1 justify-end max-w-lg">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs sm:text-sm font-black text-gray-200 group-hover:text-white transition-colors">{match.home_team || 'Gabby UTD'}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentHomeLogo} alt="Home Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full bg-black/40 border border-gray-700 p-0.5 shadow-md" onError={(e)=>{(e.target as HTMLImageElement).src=DEFAULT_HOME_LOGO}} />
                    </div>

                    <div className="bg-black/60 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-gray-800 shadow-inner font-mono text-center min-w-[70px] flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base font-black text-white">{match.home_score}</span>
                      <span className="text-xs text-gray-600 pb-0.5">:</span>
                      <span className="text-sm sm:text-base font-black text-white">{match.away_score}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentAwayLogo} alt="Away Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full bg-black/40 border border-gray-700 p-0.5 shadow-md" onError={(e)=>{(e.target as HTMLImageElement).src=DEFAULT_AWAY_LOGO}} />
                      <span className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-gray-300 transition-colors">{match.away_team || '상대 팀'}</span>
                    </div>
                  </div>
                </button>
                {selectedMatchId === match.id && (
                  <div className="border-t border-white/10 bg-black/30 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-black text-white">경기 상세</h2>
                      <span className="text-[10px] font-bold text-gray-500">득점 기록</span>
                    </div>
                    {goals.filter((goal) => goal.match_id === match.id).length === 0 ? (
                      <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-xs text-gray-500">등록된 득점 기록이 없습니다.</p>
                    ) : (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {goals.filter((goal) => goal.match_id === match.id).map((goal) => (
                          <div key={goal.id} className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                            <p className="text-sm font-black text-white">
                              {goal.minute ? `${goal.minute}' ` : ''}{goal.scorer_name}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-gray-500">{goal.team === 'away' ? match.away_team || '상대 팀' : match.home_team || 'Gabby UTD'}</p>
                            {goal.note && <p className="mt-2 text-xs text-gray-400">{goal.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
