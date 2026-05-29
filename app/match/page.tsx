'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. 내부에 직접 Supabase 연결 코드를 박아서 경로 에러를 완전히 없앱니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MatchData {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  date?: string;
}

export default function MatchPage() {
  const matchId = "1"; // 관리자 페이지에서 수정하는 경기 ID와 일치해야 합니다.
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Supabase에서 최신 경기 결과 가져오기
  useEffect(() => {
    async function fetchMatchData() {
      const { data, error } = await supabase
        .from('matches')
        .select('home_team, away_team, home_score, away_score, date')
        .eq('id', matchId)
        .single();

      if (data && !error) {
        setMatch(data);
      } else {
        console.error("데이터를 가져오지 못했습니다.", error);
      }
      setLoading(false);
    }
    fetchMatchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 bg-gray-50">로딩 중...</div>;
  }

  // 데이터가 없을 때 보여줄 기본값
  const displayHomeTeam = match?.home_team || '계비 UTD';
  const displayAwayTeam = match?.away_team || '잔뇨 FC';
  const displayHomeScore = match?.home_score ?? 7;
  const displayAwayScore = match?.away_score ?? 2;
  const displayDate = match?.date || '최근 경기 결과';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* 매치 카드 컨테이너 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* 상단 경기 정보 */}
        <div className="bg-slate-800 text-center py-3 text-white text-xs font-semibold tracking-wider">
          ⚽ {displayDate} • 공식 매치 리포트
        </div>

        {/* 스코어보드 섹션 */}
        <div className="flex items-center justify-between px-6 py-8 bg-gradient-to-b from-slate-50 to-white">
          {/* 홈 팀 (계비 UTD) */}
          <div className="flex flex-col items-center w-1/3 text-center">
            <span className="text-4xl mb-2">🏆</span>
            <span className="font-bold text-base text-slate-800">{displayHomeTeam}</span>
            {displayHomeScore > displayAwayScore && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded mt-1">WIN ★</span>
            )}
          </div>

          {/* 스코어 */}
          <div className="flex items-center justify-center w-1/3">
            <span className={`text-4xl font-extrabold ${displayHomeScore > displayAwayScore ? 'text-emerald-600' : 'text-slate-400'}`}>
              {displayHomeScore}
            </span>
            <span className="text-xl font-bold text-gray-300 mx-3">:</span>
            <span className={`text-4xl font-extrabold ${displayAwayScore > displayHomeScore ? 'text-emerald-600' : 'text-slate-400'}`}>
              {displayAwayScore}
            </span>
          </div>

          {/* 어웨이 팀 (잔뇨 FC) */}
          <div className="flex flex-col items-center w-1/3 text-center">
            <span className="text-4xl mb-2">🏃</span>
            <span className="font-bold text-base text-slate-700">{displayAwayTeam}</span>
            {displayAwayScore > displayHomeScore && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded mt-1">WIN ★</span>
            )}
          </div>
        </div>

        <hr className="border-gray-100 mx-6" />

        {/* 득점 리포트 고정 안내 */}
        <div className="p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">경기 결과 요약</p>
          <p className="text-sm font-semibold text-slate-700">
            {displayHomeScore > displayAwayScore 
              ? `${displayHomeTeam}, 화끈한 공격력으로 ${displayHomeScore}-${displayAwayScore} 대승!` 
              : `${displayDate} 경기 종료`}
          </p>
        </div>

        {/* 하단 바 */}
        <div className="bg-slate-50 py-3 text-center text-[11px] text-slate-400 border-t border-gray-100">
          이 페이지는 실시간으로 경기 결과 데이터를 반영합니다.
        </div>

      </div>
    </div>
  );
}