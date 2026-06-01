'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Player {
  id: number;
  name: string;
  position: string;
  back_number?: number;
  lineup_spot?: number | null;
}

const SPOTS = [
  { id: 9, label: '좌측 공격수 (LW)' },
  { id: 10, label: '중앙 공격수 (ST)' },
  { id: 11, label: '우측 공격수 (RW)' },
  { id: 6, label: '좌측 미드필더 (LCM)' },
  { id: 7, label: '중앙 미드필더 (CM)' },
  { id: 8, label: '우측 미드필더 (RCM)' },
  { id: 2, label: '좌측 수비수 (LB)' },
  { id: 3, label: '중앙 수비수 1 (LCB)' },
  { id: 4, label: '중앙 수비수 2 (RCB)' },
  { id: 5, label: '우측 수비수 (RB)' },
  { id: 1, label: '골키퍼 (GK)' },
];

export default function AdminLineup() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLineup, setCurrentLineup] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        alert('🔒 접근 권한이 없습니다. 관리자 로그인이 필요합니다.');
        router.push('/admin'); 
        return;
      }
      await fetchPlayers();
    };

    checkAdminAuth();
  }, [router]);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setPlayers(data);
      const initialForm: { [key: number]: string } = {};
      data.forEach((p) => {
        if (p.lineup_spot) {
          initialForm[p.lineup_spot] = p.id.toString();
        }
      });
      setCurrentLineup(initialForm);
    }
    setLoading(false);
  };

  const handleSelectChange = (spotId: number, playerId: string) => {
    setCurrentLineup((prev) => ({ ...prev, [spotId]: playerId }));
  };

  const handleSaveLineup = async () => {
    try {
      setIsSaving(true);

      const activeSelectedIds = Object.values(currentLineup).filter(id => id !== '' && id !== 'none');
      const hasDuplicates = activeSelectedIds.length !== new Set(activeSelectedIds).size;
      
      if (hasDuplicates) {
        alert('❌ 경고: 한 명의 선수를 여러 포지션에 중복 배치할 수 없습니다.');
        setIsSaving(false);
        return;
      }

      // 1. 기존에 포지션을 부여받았던 선수들의 lineup_spot을 초기화
      await supabase
        .from('players')
        .update({ lineup_spot: null })
        .not('lineup_spot', 'is', null);

      // 2. 지정된 선수들에게 순차적으로 스팟 고유 번호 부여
      for (const spot of SPOTS) {
        const targetPlayerId = currentLineup[spot.id];
        if (targetPlayerId && targetPlayerId !== 'none') {
          await supabase
            .from('players')
            .update({ lineup_spot: spot.id })
            .eq('id', parseInt(targetPlayerId));
        }
      }

      alert('🔥 선발 라인업 스쿼드가 성공적으로 저장되어 메인 화면에 반영되었습니다!');
      fetchPlayers();
    } catch (err) {
      console.error(err);
      alert('저장 도중 에러가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#050505] text-white min-h-screen flex flex-col items-center justify-center gap-3 text-sm font-bold">
        <div className="w-6 h-6 border-2 border-[#f2d272] border-t-transparent rounded-full animate-spin"></div>
        <span>🔒 관리자 인증 상태 및 스쿼드 정보를 확인 중입니다...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-white min-h-screen p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-5">
          <div>
            <span className="text-[#f2d272] uppercase tracking-widest text-[10px] font-black block">Gabby UTD Admin Zone</span>
            <h1 className="text-3xl font-black tracking-tight mt-1">📋 선발 라인업 관리판</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="text-xs font-bold text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-xl bg-white/5 transition-all">
              ⬅ 어드민 홈
            </Link>
            <Link href="/" className="text-xs font-bold text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-xl bg-white/5 transition-all">
              메인 화면 ➔
            </Link>
          </div>
        </div>

        <blockquote className="border-l-2 border-[#f2d272] bg-white/5 p-4 rounded-r-xl text-xs text-gray-400 mb-8 leading-relaxed">
          * 이 페이지는 보안처리 되었습니다. 메인 어드민 인증 세션이 만료되면 자동으로 차단됩니다.
        </blockquote>

        <div className="bg-[#0a0a0a] border border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <h3 className="font-black text-lg text-gray-200 flex items-center gap-2 mb-4">
            <span>⚽ 4-3-3 포메이션 배치</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SPOTS.map((spot) => {
              const currentVal = currentLineup[spot.id] || 'none';
              return (
                <div key={spot.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <label className="text-xs font-extrabold text-[#f2d272] tracking-wide">
                    {spot.label}
                  </label>
                  <select
                    value={currentVal}
                    onChange={(e) => handleSelectChange(spot.id, e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#f2d272] transition-colors cursor-pointer"
                  >
                    <option value="none">-- 공석 (미지정) --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id.toString()}>
                        {p.name} ({p.position || '포지션 미지정'}) {p.back_number ? `[No.${p.back_number}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-white/5">
            <button
              onClick={handleSaveLineup}
              disabled={isSaving}
              className="w-full bg-[#f2d272] hover:bg-white text-black text-sm font-black py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(242,210,114,0.15)] disabled:opacity-50"
            >
              {isSaving ? '💾 시스템에 스쿼드 저장 중...' : '💾 전술판 라인업 저장하기'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
