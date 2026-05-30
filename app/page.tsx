'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface Player { id: number; name: string; position: string; }

interface MatchData { 
  id: number; 
  home_team?: string; 
  away_team?: string; 
  home_score: number; 
  away_score: number; 
  home_logo?: string; 
  away_logo?: string; 
  date?: string; 
  recent_form?: string;
  is_practice?: boolean; 
  match_result?: string; 
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'inquiry' | 'join'>('inquiry');
  const [players, setPlayers] = useState<Player[]>([]);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [matchLoading, setMatchLoading] = useState<boolean>(true);
  const [senderName, setSenderName] = useState('');
  const [email, setEmail] = useState(''); 
  const [phone, setPhone] = useState(''); 
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*').order('id', { ascending: true });
      if (!error && data) setPlayers(data);
    };

    const fetchMatchData = async () => {
      try {
        const { data, error } = await supabase.from('matches').select('*');
        if (data && data.length > 0 && !error) {
          setMatch(data[0]);
        }
      } catch (e) {
        console.error("Match data fetch fallback active:", e);
      } finally {
        setMatchLoading(false);
      }
    };

    fetchPlayers();
    fetchMatchData();
  }, []);

  // 포지션별 카드 전체 배경색 및 뱃지 스타일 매칭 함수
  const getPositionStyles = (pos: string) => {
    const cleanPos = pos ? pos.trim() : '';
    if (cleanPos.includes('스트라이커') || cleanPos.toLowerCase().includes('fw') || cleanPos.includes('공격수')) {
      return { 
        label: '스트라이커', 
        cardClass: 'bg-gradient-to-br from-[#4c161c] to-[#2d0a0e] border-red-500/20 hover:border-red-500/40',
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40' 
      };
    }
    if (cleanPos.includes('미드필더') || cleanPos.toLowerCase().includes('mf') || cleanPos.includes('중원')) {
      return { 
        label: '미드필더', 
        cardClass: 'bg-gradient-to-br from-[#143d28] to-[#0a2214] border-emerald-500/20 hover:border-emerald-500/40',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
      };
    }
    return { 
      label: cleanPos || '수비수', 
      cardClass: 'bg-gradient-to-br from-[#162a4c] to-[#0a1428] border-blue-500/20 hover:border-blue-500/40',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !email.trim() || !phone.trim() || !content.trim()) {
      return alert('필수 항목(*)을 모두 입력해 주세요.');
    }
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('messages')
        .insert([
          { 
            type: activeTab, 
            name: senderName.trim(), 
            content: `[이메일: ${email.trim()} / 연락처: ${phone.trim()}]\n\n내용:\n${content.trim()}` 
          }
        ]);

      if (error) {
        alert('데이터베이스 전송에 실패했습니다: ' + error.message);
        return;
      }

      const targetEmail = 'gyebi-utd@email.com'; 
      const subject = encodeURIComponent(`[${activeTab === 'join' ? '참가 신청' : '팀 문의'}] 계비 UTD ${senderName}님의 메시지`);
      const body = encodeURIComponent(
        `이름: ${senderName}\n이메일: ${email}\n연락처: ${phone}\n\n내용:\n${content}`
      );
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

      alert('계비 UTD 구단 데이터베이스에 성공적으로 접수되었습니다! 🔥');
      setSenderName('');
      setEmail('');
      setPhone('');
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayHomeTeam = match?.home_team || '계비 유나이티드';
  const displayAwayTeam = match?.away_team || '잔뇨 FC';
  const displayHomeScore = match?.home_score ?? 7;
  const displayAwayScore = match?.away_score ?? 2;
  const displayDate = match?.date || '2026년 5월 29일';
  const homeLogoUrl = match?.home_logo ? match.home_logo.trim() : '';
  const awayLogoUrl = match?.away_logo ? match.away_logo.trim() : '';

  return (
    <div className="bg-[#4a1525] text-white min-h-screen font-sans antialiased pb-20">
      
      {/* 1. 히어로 구역 */}
      <section className="flex flex-col items-center justify-center text-center pt-24 pb-16 px-4">
        <div className="w-40 h-40 rounded-full bg-black/30 border-4 border-[#d4af37] flex items-center justify-center overflow-hidden shadow-2xl mb-6">
          {homeLogoUrl ? (
            <img src={homeLogoUrl} alt="Club Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#d4af37] text-xl font-black text-center">계비 UTD</span>
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-wider mb-3">계비 UTD</h1>
        <p className="text-[#d4af37] text-lg sm:text-xl font-bold tracking-widest mb-4">WE PLAY. WE FIGHT. WE WIN.</p>
        <p className="text-gray-300 text-sm">2026 구단 공식 프리미엄 대시보드</p>
      </section>

      {/* 2. 팀 소개 */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <div className="bg-[#36101b] rounded-2xl p-6 sm:p-8 border border-white/5 shadow-xl text-center leading-relaxed text-gray-200 text-base max-w-2xl mx-auto">
          <strong className="text-[#d4af37] text-lg block mb-2">🛡️ 팀 소개</strong>
          <span className="font-medium text-gray-300">
            <strong className="text-white">계비 UTD</strong>는 타협하지 않는 열정의 축구단입니다. <br/>
            언제나 최고의 경기력과 끈끈한 팀워크로 승리를 향해 전진합니다.
          </span>
        </div>
      </section>

      {/* 3. 선수 명단 구역 */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-center flex justify-center items-center gap-2 mb-3 text-[#e5c158]">
          👥 선수 명단
        </h2>
        
        {/* 범례 가이드 라인 */}
        <div className="flex justify-center items-center gap-5 text-xs text-gray-300 mb-8 font-semibold bg-black/20 py-2 px-6 rounded-full w-fit mx-auto border border-white/5">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600" /> 스트라이커</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600" /> 미드필더</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600" /> 수비수</span>
        </div>

        {players.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12 bg-[#36101b] rounded-2xl border border-white/5 max-w-xl mx-auto">선수 데이터를 불러오는 중이거나 명단이 비어있습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {players.map((player) => {
              const posStyle = getPositionStyles(player.position);
              return (
                <div 
                  key={player.id} 
                  className={`rounded-2xl p-6 sm:p-7 flex flex-col items-center border shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${posStyle.cardClass}`}
                >
                  <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mb-4 text-3xl bg-black/30 text-white/80 shadow-md">
                    👤
                  </div>
                  <div className="font-black text-lg sm:text-xl mb-3 text-white tracking-wide truncate w-full text-center">
                    {player.name}
                  </div>
                  <span className={`text-xs px-3.5 py-1 rounded-full font-bold border tracking-wider shadow-inner ${posStyle.badgeClass}`}>
                    {posStyle.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. 매치 스코어 보드 구역 */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <h2 className="text-2xl sm:text-3xl font-black text-center flex justify-center items-center gap-2 mb-6 text-[#e5c158]">
          🏆 경기 기록
        </h2>
        
        <div className="relative bg-[#36101b] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-3xl mx-auto">
          
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[10px] sm:text-xs font-black tracking-widest bg-amber-500 text-black px-3 py-1 rounded-md shadow">
              연습경기
            </span>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <span className={`text-[10px] sm:text-xs font-black tracking-widest px-3 py-1 rounded-md shadow border ${
              match?.match_result === '패배' ? 'bg-red-600/30 text-red-400 border-red-500/40' : 'bg-green-600/30 text-green-400 border-green-500/40'
            }`}>
              {match?.match_result || '승리'}
            </span>
          </div>

          <div className="bg-black/30 text-center py-3 text-xs sm:text-sm font-bold text-gray-400 tracking-widest border-b border-white/5">
            📅 {displayDate}
          </div>

          {matchLoading ? (
            <div className="text-center py-12 text-sm text-gray-400">경기 데이터를 분석 중입니다...</div>
          ) : (
            <div className="flex items-center justify-between px-6 sm:px-12 py-12">
              {/* 홈 팀 */}
              <div className="flex flex-col items-center w-5/12 text-center">
                <div className="w-16 h-16 sm:w-20 h-20 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center overflow-hidden mb-3 shadow-xl">
                  {homeLogoUrl ? <img src={homeLogoUrl} className="w-full h-full object-cover" /> : <span className="text-4xl">🛡️</span>}
                </div>
                <span className="font-black text-base sm:text-xl text-amber-400 tracking-wide truncate w-full">{displayHomeTeam}</span>
              </div>

              {/* 대형 스코어 */}
              <div className="flex flex-col items-center justify-center w-2/12 min-w-[100px]">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl sm:text-5xl font-black text-[#d4af37] bg-black/40 px-4 py-2 rounded-xl shadow-md">{displayHomeScore}</span>
                  <span className="text-2xl font-bold text-gray-500">-</span>
                  <span className="text-3xl sm:text-5xl font-black text-white bg-black/40 px-4 py-2 rounded-xl shadow-md">{displayAwayScore}</span>
                </div>
              </div>

              {/* 원정 팀 */}
              <div className="flex flex-col items-center w-5/12 text-center">
                <div className="w-16 h-16 sm:w-20 h-20 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center overflow-hidden mb-3 shadow-xl">
                  {awayLogoUrl ? <img src={awayLogoUrl} className="w-full h-full object-cover" /> : <span className="text-4xl">🏃</span>}
                </div>
                <span className="font-black text-base sm:text-xl text-white tracking-wide truncate w-full">{displayAwayTeam}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. 연락하기 문의 폼 구역 */}
      <section className="max-w-2xl mx-auto px-4 mb-20">
        <h2 className="text-2xl font-black text-center flex justify-center items-center gap-2 mb-6 text-[#e5c158]">
          ✉️ 연락하기
        </h2>
        <div className="grid grid-cols-2 bg-black/20 rounded-xl p-1 mb-4 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('inquiry')}
            className={`py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'inquiry' ? 'bg-[#d4af37] text-black shadow-md font-black' : 'text-gray-400'
            }`}
          >
            ✉️ 팀 문의
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'join' ? 'bg-[#d4af37] text-black shadow-md font-black' : 'text-gray-400'
            }`}
          >
            👤 팀 참가 신청
          </button>
        </div>

        <form onSubmit={handleSendMessage} className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">이름 *</label>
            <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="홍길동" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">이메일 *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">연락처 *</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">
              {activeTab === 'join' ? '자기소개 및 선호 포지션 *' : '문의 내용 *'}
            </label>
            <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={activeTab === 'join' ? "선호 포지션, 주요 경력 등 어필할 내용을 작성해주세요." : "문의하실 내용을 작성해주세요."} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#d4af37] text-black font-black py-3.5 rounded-xl text-sm hover:bg-[#c4a030] disabled:opacity-50 transition-colors shadow-lg">
            {isSubmitting ? '구단 서버 등록 중...' : '🛫 전송하기'}
          </button>
          <p className="text-[11px] text-gray-400 text-center pt-1">
            전송 버튼을 누르면 관리자에게 전송됩니다.
          </p>
        </form>
      </section>

      {/* 6. 푸터 구역 */}
      <footer className="max-w-md mx-auto text-center px-4 space-y-4">
        <div className="flex items-center justify-center gap-2 text-gray-300">
          <span className="text-2xl">🛡️</span> 
          <span className="font-black text-base tracking-wider">계비 UTD</span>
        </div>
        <p className="text-xs font-bold text-[#d4af37]/70 tracking-widest uppercase">
          WE PLAY. WE FIGHT. WE WIN.
        </p>
        <div className="pt-1">
          <a
            href="https://www.instagram.com/gabby.utd?igsh=YWk4N2FiZGo4Nnht" 
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-xs font-bold px-10 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
          >
            <span>📸 Instagram</span>
          </a>
        </div>
        <p className="text-[11px] text-gray-500 pt-3">
          © 2026 계비 UTD. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
