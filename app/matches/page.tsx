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
  date?: string;
  is_practice?: boolean;
  match_result?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 필터 상태 관리
  const [typeFilter, setTypeFilter] = useState<'all' | 'official' | 'practice'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | '승리' | '무승부' | '패배'>('all');

  useEffect(() => {
    fetchOpenMatches();
  }, []);

  const fetchOpenMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('id', { ascending: false }); // 최신 경기가 맨 위로

      if (data && !error) {
        setMatches(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 필터링 처리된 매치 리스트
  const filteredMatches = matches.filter((m) => {
    const matchType = m.is_practice ? 'practice' : 'official';
    const passType = typeFilter === 'all' || matchType === typeFilter;
    const passResult = resultFilter === 'all' || (m.match_result || '무승부') === resultFilter;
    return passType && passResult;
  });

  // 📊 역대 성적 통계 계산
  const totalCount = filteredMatches.length;
  const winCount = filteredMatches.filter((m) => m.match_result === '승리').length;
  const drawCount = filteredMatches.filter((m) => m.match_result === '무승부' || !m.match_result).length;
  const loseCount = filteredMatches.filter((m) => m.match_result === '패배').length;
  const winRate = totalCount > 0 ? Math.round((winCount / totalCount) * 100) : 0;

  return (
    <div className="bg-[#120206] text-white min-h-screen font-sans antialiased selection:bg-[#d4af37] selection:text-black">
      {/* 🏠 글로벌 상단 헤더 내비게이션 바 (홈 바로가기 포함) */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          
          {/* 좌측: 로고 + 홈 바로가기 단추 복합 배치 */}
          <div className="flex items-center gap-3">
            <Link href="/" className="font-black text-lg tracking-wider text-white hover:text-[#d4af37] transition-colors flex items-center gap-1.5">
              <span>🏟️ KAEBI UTD</span>
            </Link>
            
            {/* ⚡ 홈 화면 바로가기 뱃지 버튼 */}
            <Link href="/" className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-[#d4af37] px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1">
              <span>🏠 홈으로</span>
            </Link>
          </div>

          {/* 우측: 내비 메뉴 텍스트 */}
          <div className="flex gap-5 text-xs sm:text-sm font-bold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">메인 홈</Link>
            <Link href="/matches" className="text-[#d4af37] border-b-2 border-[#d4af37] pb-1">MATCHES</Link>
          </div>
          
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        
        {/* 타이틀 섹션 */}
        <div className="text-center sm:text-left space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-amber-400">
            📊 구단 역대 경기 기록실
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium">
            계비 UTD가 걸어온 모든 공식 매치 및 친선 경기 아카이브입니다.
          </p>
        </div>

        {/* 📊 미니 데이터 통계 보드 */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-[#230810] p-4 rounded-2xl border border-white/5 shadow-2xl text-center">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400">총 경기수</p>
            <p className="text-base sm:text-2xl font-black text-white font-mono">{totalCount}<span className="text-xs font-normal text-gray-400 ml-0.5">전</span></p>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <p className="text-[10px] sm:text-xs font-bold text-green-400">승리</p>
            <p className="text-base sm:text-2xl font-black text-green-400 font-mono">{winCount}</p>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400">무 / 패</p>
            <p className="text-base sm:text-2xl font-black text-gray-300 font-mono">{drawCount}<span className="text-xs font-normal text-gray-500">무</span> {loseCount}<span className="text-xs font-normal text-gray-500">패</span></p>
          </div>
          <div className="space-y-1 border-l border-white/5">
            <p className="text-[10px] sm:text-xs font-bold text-amber-400">필터 승률</p>
            <p className="text-base sm:text-2xl font-black text-[#d4af37] font-mono">{winRate}<span className="text-xs font-normal text-amber-500/70">%</span></p>
          </div>
        </div>

        {/* 🎛️ 필터 컨트롤러 구역 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-black/20 p-3 rounded-xl border border-white/5 text-xs font-bold">
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <span className="text-gray-400 text-[11px] whitespace-nowrap">경기 유형:</span>
            {/* 공식전 / 친선전 토글 */}
            <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/5 w-full sm:w-auto">
              <button onClick={() => setTypeFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${typeFilter === 'all' ? 'bg-[#d4af37] text-black font-black' : 'text-gray-400 hover:text-white'}`}>전체</button>
              <button onClick={() => setTypeFilter('official')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${typeFilter === 'official' ? 'bg-amber-600 text-white font-black' : 'text-gray-400 hover:text-white'}`}>공식전</button>
              <button onClick={() => setTypeFilter('practice')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${typeFilter === 'practice' ? 'bg-gray-700 text-gray-200 font-black' : 'text-gray-400 hover:text-white'}`}>친선전</button>
            </div>
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <span className="text-gray-400 text-[11px] whitespace-nowrap">결과별 필터:</span>
            <div className="flex bg-black/30 p-0.5 rounded-lg border border-white/5 w-full sm:w-auto">
              {(['all', '승리', '무승부', '패배'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setResultFilter(res)}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-md transition-all text-[11px] ${
                    resultFilter === res 
                      ? res === '승리' ? 'bg-green-600 text-white font-black' :
                        res === '패배' ? 'bg-red-600 text-white font-black' :
                        res === '무승부' ? 'bg-gray-500 text-white font-black' : 'bg-white text-black font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {res === 'all' ? '전체결과' : res}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 📅 스코어보드 피드 리스트 구역 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 space-y-2">
              <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-400">역대 경기 데이터 로딩 중...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-20 bg-black/10 rounded-2xl border border-white/5 border-dashed">
              <p className="text-sm text-gray-400 font-medium">조건에 맞는 경기 기록이 존재하지 않습니다. ⚽</p>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const currentResult = match.match_result || '무승부';
              return (
                <div 
                  key={match.id} 
                  className="bg-gradient-to-b from-[#20070e] to-[#180409] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-white/10 transition-all shadow-lg"
                >
                  {/* 좌측 정보 영역 */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start border-b sm:border-b-0 border-white/5 pb-2 sm:pb-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        currentResult === '승리' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        currentResult === '패배' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {currentResult}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        match.is_practice ? 'bg-gray-800 text-gray-400 border border-white/5' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {match.is_practice ? '친선 매치' : '공식 리그'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500 font-semibold">{match.date || '날짜 미지정'}</span>
                  </div>

                  {/* 중앙 매치 현황 구역 */}
                  <div className="flex items-center justify-center gap-4 sm:gap-8 flex-1 w-full my-1">
                    {/* 홈 팀 */}
                    <div className="flex items-center gap-2 sm:gap-3 w-[40%] justify-end">
                      <span className="font-black text-sm sm:text-base text-gray-100 truncate text-right">{match.home_team || '계비 UTD'}</span>
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-sm sm:text-base shadow-inner overflow-hidden flex-shrink-0">
                        {match.home_logo && match.home_logo.startsWith('http') ? (
                          <img src={match.home_logo} alt="home" className="w-full h-full object-contain p-1" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
                        ) : '🛡️'}
                      </div>
                    </div>

                    {/* 스코어 스코어보드 */}
                    <div className="font-mono bg-black/60 px-3.5 py-1.5 rounded-xl border border-white/10 font-black text-base sm:text-xl text-center min-w-[70px] shadow-md tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">
                      {match.home_score} : {match.away_score}
                    </div>

                    {/* 원정 팀 */}
                    <div className="flex items-center gap-2 sm:gap-3 w-[40%] justify-start">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-sm sm:text-base shadow-inner overflow-hidden flex-shrink-0">
                        {match.away_logo && match.away_logo.startsWith('http') ? (
                          <img src={match.away_logo} alt="away" className="w-full h-full object-contain p-1" onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
                        ) : '🏃'}
                      </div>
                      <span className="font-black text-sm sm:text-base text-gray-300 truncate text-left">{match.away_team}</span>
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
