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

// ⚽ 포메이션별 스폿 ID와 포지션 명칭 동적 매핑 매트릭스
const FORMATION_CONFIG: Record<string, { id: number; label: string }[]> = {
  '4-3-3': [
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
  ],
  '5-3-2': [
    { id: 10, label: '좌측 전방 공격수 (LS)' },
    { id: 11, label: '우측 전방 공격수 (RS)' },
    { id: 6, label: '좌측 중앙 미드필더 (LCM)' },
    { id: 7, label: '중앙 미드필더 (CM)' },
    { id: 8, label: '우측 중앙 미드필더 (RCM)' },
    { id: 2, label: '좌측 윙백 (LWB)' },
    { id: 3, label: '좌측 센터백 (LCB)' },
    { id: 9, label: '중앙 센터백 (CB)' },
    { id: 4, label: '우측 센터백 (RCB)' },
    { id: 5, label: '우측 윙백 (RWB)' },
    { id: 1, label: '골키퍼 (GK)' },
  ],
  '4-4-2': [
    { id: 10, label: '좌측 전방 공격수 (LS)' },
    { id: 11, label: '우측 전방 공격수 (RS)' },
    { id: 9, label: '좌측 미드필더 (LM)' },
    { id: 6, label: '좌측 중앙 미드필더 (LCM)' },
    { id: 8, label: '우측 중앙 미드필더 (RCM)' },
    { id: 7, label: '우측 미드필더 (RM)' },
    { id: 2, label: '좌측 수비수 (LB)' },
    { id: 3, label: '중앙 수비수 1 (LCB)' },
    { id: 4, label: '중앙 수비수 2 (RCB)' },
    { id: 5, label: '우측 수비수 (RB)' },
    { id: 1, label: '골키퍼 (GK)' },
  ],
  '3-5-2': [
    { id: 10, label: '좌측 전방 공격수 (LS)' },
    { id: 11, label: '우측 전방 공격수 (RS)' },
    { id: 9, label: '좌측 미드필더 (LM)' },
    { id: 6, label: '좌측 중앙 미드필더 (LCM)' },
    { id: 7, label: '수비형 미드필더 (CDM)' },
    { id: 8, label: '우측 중앙 미드필더 (RCM)' },
    { id: 5, label: '우측 미드필더 (RM)' },
    { id: 2, label: '좌측 센터백 (LCB)' },
    { id: 3, label: '중앙 센터백 (CB)' },
    { id: 4, label: '우측 센터백 (RCB)' },
    { id: 1, label: '골키퍼 (GK)' },
  ],
};

export default function AdminLineup() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [formation, setFormation] = useState<string>('4-3-3'); // 포메이션 상태 추가
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLineup, setCurrentLineup] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const checkAdminAuth = async () => {
      const isSavedLogin = localStorage.getItem('gb_admin_authenticated');
    
      if (isSavedLogin !== 'true') {
        alert('🔒 접근 권한이 없습니다. 관리자 로그인이 필요합니다.');
        router.push('/admin'); 
        return;
      }
      
      // 인증 성공 시 포메이션 데이터와 선수 명단 함께 호출
      await fetchInitialData();
    };

    checkAdminAuth();
  }, [router]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. 활성화된 글로벌 포메이션 로드 (formations 테이블의 id: 1 기준)
      const { data: fData } = await supabase
        .from('formations')
        .select('current_formation')
        .eq('id', 1)
        .single();
        
      if (fData?.current_formation) {
        setFormation(fData.current_formation);
      }

      // 2. 선수 명단 데이터 로드
      const { data: pData, error: pError } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true });

      if (!pError && pData) {
        setPlayers(pData);
        const initialForm: { [key: number]: string } = {};
        pData.forEach((p) => {
          if (p.lineup_spot) {
            initialForm[p.lineup_spot] = p.id.toString();
          }
        });
        setCurrentLineup(initialForm);
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err);
    } finally {
      setLoading(false);
    }
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

      // 1. [추가] 포메이션 테이블 변경사항 저장
      await supabase
        .from('formations')
        .update({ current_formation: formation, updated_at: new Date().toISOString() })
        .eq('id', 1);

      // 2. 기존에 포지션을 부여받았던 선수들의 lineup_spot을 초기화
      await supabase
        .from('players')
        .update({ lineup_spot: null })
        .not('lineup_spot', 'is', null);

      // 3. 현재 선택한 포메이션 양식(SPOTS 데이터) 기준으로 순차 고유 번호 부여
      const activeSpots = FORMATION_CONFIG[formation] || FORMATION_CONFIG['4-3-3'];
      for (const spot of activeSpots) {
        const targetPlayerId = currentLineup[spot.id];
        if (targetPlayerId && targetPlayerId !== 'none') {
          await supabase
            .from('players')
            .update({ lineup_spot: spot.id })
            .eq('id', parseInt(targetPlayerId));
        }
      }

      alert('🔥 선발 라인업 및 포메이션 전술이 성공적으로 저장되어 메인 화면에 반영되었습니다!');
      fetchInitialData();
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
        <span>🔒 관리자 인증 상태 및 전술 정보를 확인 중입니다...</span>
      </div>
    );
  }

  // 현재 선택된 포메이션에 가변적으로 부합하는 11개 스폿 배열 선택
  const currentSpots = FORMATION_CONFIG[formation] || FORMATION_CONFIG['4-3-3'];

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
          
          {/* ⚙️ [수정] 포메이션 선택 컨트롤러 단락 */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-gray-200">팀 전술 대형 (포메이션) 변경</h3>
              <p className="text-[11px] text-gray-400">대형 선택 시 필드 배치 스폿 라벨이 즉시 동적 맵핑됩니다.</p>
            </div>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              className="bg-black border border-gray-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#f2d272] cursor-pointer min-w-[160px]"
            >
              <option value="4-4-2">4 - 4 - 2 (기본)</option>
              <option value="5-3-2">5 - 3 - 2 (수비형)</option>
              <option value="4-3-3">4 - 3 - 3 (공격형)</option>
              <option value="3-5-2">3 - 5 - 2 (미드필더형)</option>
            </select>
          </div>
          
          {/* 가변 스폿 리스트 렌더링 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {currentSpots.map((spot) => {
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
              {isSaving ? '💾 시스템에 전술 및 스쿼드 저장 중...' : '💾 전술판 라인업 저장하기'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}