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

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [typeFilter, setTypeFilter] = useState<'all' | 'official' | 'practice'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'draw' | 'lose'>('all');

  const DEFAULT_HOME_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/home_icon/home_icon.jpg'; 
  const DEFAULT_AWAY_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg'; 

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('id', { ascending: false }); // 최신 순 정렬

      if (!error && data) {
        setMatches(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="bg-[#1a050a] min-h-screen text-white font-sans antialiased pb-20">
      
      {/* 최상단 네비게이션 바 */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-black text-lg tracking-wider text-white hover:text-[#e5c158] transition-colors flex items-center gap-2 group">
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
            <Link href="/matches" className="text-[#e5c158] border-b-2 border-[#e5c158] pb-1">MATCHES</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-100 flex items-center gap-2">
            <span className="inline-block w-3 h-6 bg-[#d4af37] rounded-sm"></span>
            구단 역대 경기 기록실
          </h1>
          <p className="text-xs text-gray-400 mt-1 pl-5">Gabby UTD 역대 매치 아카이브입니다.</p>
        </div>

        {/* 대시보드 스코어 */}
        <div className="grid grid-cols-4 bg-[#2b0c14] border border-white/5 rounded-2xl p-4 text-center divide-x divide-white/5 shadow-lg">
          <div>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">총 경기수</p>
            <p className="text-base sm:text-xl font-black mt-1 text-gray-200">{totalMatches}<span className="text-xs font-normal text-gray-400 ml-0.5">전</span></p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-green-400 font-bold">승리</p>
            <p className="text-base sm:text-xl font-black mt-1 text-green-400">{wins}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-400 font-medium">무 / 패</p>
            <p className="text-base sm:text-xl font-black mt-1 text-gray-300">{draws}<span className="text-[10px] font-normal text-gray-500 mx-1">무</span>{loses}<span className="text-[10px] font-normal text-gray-500 ml-0.5">패</span></p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-amber-400 font-bold">승률</p>
            <p className="text-base sm:text-xl font-black mt-1 text-amber-400">{winRate}<span className="text-xs font-normal ml-0.5">%</span></p>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="bg-[#2b0c14]/60 border border-white/5 rounded-xl p-3 flex flex-wrap gap-4 items-center justify-between text-xs font-bold text-gray-400">
          <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-lg">
            <button onClick={() => setTypeFilter('all')} className={`px-2.5 py-1 rounded-md transition-colors ${typeFilter === 'all' ? 'bg-[#d4af37] text-black font-black' : 'hover:text-white'}`}>전체</button>
            <button onClick={() => setTypeFilter('official')} className={`px-2.5 py-1 rounded-md transition-colors ${typeFilter === 'official' ? 'bg-[#d4af37] text-black font-black' : 'hover:text-white'}`}>공식전</button>
            <button onClick={() => setTypeFilter('practice')} className={`px-2.5 py-1 rounded-md transition-colors ${typeFilter === 'practice' ? 'bg-[#d4af37] text-black font-black' : 'hover:text-white'}`}>친선전</button>
          </div>

          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg text-[11px]">
            <button onClick={() => setResultFilter('all')} className={`px-2 py-0.5 rounded transition-colors ${resultFilter === 'all' ? 'bg-white text-black font-black' : 'hover:text-white'}`}>전체결과</button>
            <button onClick={() => setResultFilter('win')} className={`px-2 py-0.5 rounded transition-colors ${resultFilter === 'win' ? 'bg-green-500 text-white font-black' : 'hover:text-white'}`}>승리</button>
            <button onClick={() => setResultFilter('draw')} className={`px-2 py-0.5 rounded transition-colors ${resultFilter === 'draw' ? 'bg-gray-500 text-white font-black' : 'hover:text-white'}`}>무승부</button>
            <button onClick={() => setResultFilter('lose')} className={`px-2 py-0.5 rounded transition-colors ${resultFilter === 'lose' ? 'bg-red-500 text-white font-black' : 'hover:text-white'}`}>패배</button>
          </div>
        </div>

        {/* 리스트 */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-500">매치 데이터를 불러오는 중...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500 bg-[#2b0c14]/20 border border-dashed border-white/5 rounded-2xl">조회된 매치 결과가 없습니다.</div>
          ) : (
            filteredMatches.map((match) => {
              const currentHomeLogo = match.home_logo && match.home_logo.startsWith('http') ? match.home_logo : DEFAULT_HOME_LOGO;
              const currentAwayLogo = match.away_logo && match.away_logo.startsWith('http') ? match.away_logo : DEFAULT_AWAY_LOGO;
              
              // ⚙️ 어드민 입력값을 그대로 쓰고, 비어있을 때만 기본 텍스트 처리
              const displayDate = match.date ? match.date.trim() : '날짜 미지정';

              return (
                <div key={match.id} className="bg-[#2b0c14] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-md hover:border-white/10 transition-all">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center gap-x-3 min-w-[100px]">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded text-center border w-fit ${
                      match.match_result === '승리' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      match.match_result === '패배' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {match.match_result || '무승부'}
                    </span>
                    <span className="text-[9px] bg-black/30 border border-white/5 text-gray-400 px-1.5 py-0.5 rounded w-fit">
                      {match.is_practice ? '친선 매치' : '공식 매치'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono font-bold block sm:inline">
                      🗓️ {displayDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 flex-1 justify-end max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-gray-100">{match.home_team || 'Gabby UTD'}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentHomeLogo} alt="Home Logo" className="w-6 h-6 object-contain rounded-full bg-black/20 p-0.5" onError={(e)=>{(e.target as HTMLImageElement).src=DEFAULT_HOME_LOGO}} />
                    </div>

                    <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-center min-w-[65px]">
                      <span className="text-sm sm:text-base font-black text-white">{match.home_score}</span>
                      <span className="text-xs text-gray-600 mx-1.5">:</span>
                      <span className="text-sm sm:text-base font-black text-white">{match.away_score}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentAwayLogo} alt="Away Logo" className="w-6 h-6 object-contain rounded-full bg-black/20 p-0.5" onError={(e)=>{(e.target as HTMLImageElement).src=DEFAULT_AWAY_LOGO}} />
                      <span className="text-xs sm:text-sm font-bold text-gray-300">{match.away_team || '상대 팀'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
