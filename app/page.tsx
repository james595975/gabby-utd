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
  is_practice: boolean; 
  match_result: string; 
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
      const { data, error } = await supabase.schema('public').from('matches').select('*');
      if (data && data.length > 0 && !error) {
        setMatch(data[0]);
      }
      setMatchLoading(false);
    };

    fetchPlayers();
    fetchMatchData();
  }, []);

  // 포지션 텍스트별 뱃지 스타일 매칭 함수
  const getPositionStyles = (pos: string) => {
    const cleanPos = pos.trim();
    if (cleanPos.includes('스트라이커') || cleanPos.toLowerCase().includes('fw') || cleanPos.includes('공격수')) {
      return { label: '스트라이커', className: 'bg-red-500/10 text-red-400 border-red-500/30' };
    }
    if (cleanPos.includes('미드필더') || cleanPos.toLowerCase().includes('mf')) {
      return { label: '미드필더', className: 'bg-green-500/10 text-green-400 border-green-500/30' };
    }
    return { label: cleanPos, className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
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

      alert('계비 UTD 구단 데이터베이스에 접수되었으며, 이메일 전송 창으로 이동합니다! 🔥');
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

  const displayHomeTeam = match?.home_team || '계비 UTD';
  const displayAwayTeam = match?.away_team || '잔뇨 FC';
  const displayHomeScore = match?.home_score ?? 7;
  const displayAwayScore = match?.away_score ?? 2;
  const displayDate = match?.date || '최근 경기 결과';
  const homeLogoUrl = match?.home_logo ? match.home_logo.trim() : '';
  const awayLogoUrl = match?.away_logo ? match.away_logo.trim() : '';

  return (
    <div className="bg-[#4a1525] text-white min-h-screen font-sans antialiased pb-12">
      
      {/* 1. 히어로 구역 */}
      <section className="flex flex-col items-center justify-center text-center pt-20 pb-16 px-4">
        <div className="w-36 h-36 sm:w-40 h-40 rounded-full bg-black/30 border-4 border-[#d4af37] flex items-center justify-center overflow-hidden shadow-2xl mb-6">
          {homeLogoUrl ? (
            <img src={homeLogoUrl} alt="Club Logo" className="w-full h-full object-cover" key={homeLogoUrl} />
          ) : (
            <span className="text-gray-300 text-xs font-bold text-center px-2">계비 UTD<br/>로고</span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-wider mb-2">계비 UTD</h1>
        <p className="text-[#d4af37] text-base sm:text-lg font-bold tracking-widest mb-4">WE PLAY. WE FIGHT. WE WIN.</p>
        <p className="text-gray-300 text-xs sm:text-sm">2026년 창립 | 열정과 도전의 축구팀</p>
      </section>

      {/* 2. 팀 소개 */}
      <section className="max-w-4xl mx-auto px-4 mb-12">
        <h2 className="text-lg sm:text-xl font-bold flex justify-center items-center gap-2 mb-4">🛡️ 팀 소개</h2>
        <div className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg text-center leading-relaxed text-gray-200 text-sm max-w-xl mx-auto">
          <strong className="text-[#d4af37]">계비 UTD</strong>는 열정 넘치는 축구팀입니다. <br className="hidden sm:block" />
          "WE PLAY. WE FIGHT. WE WIN."이라는 모토 아래, 팀원들과 함께 경기를 즐기며 성장하고 있습니다.
        </div>
      </section>

      {/* 3. 선수 명단 구역 (위로 이동 완료 👥) */}
      <section className="max-w-5xl mx-auto px-4 mb-16">
        <h2 className="text-lg sm:text-xl font-bold flex justify-center items-center gap-2 mb-2">👥 선수 명단 ({players.length}명)</h2>
        
        {/* 상단 포지션 컬러 범례 안내 레이블 */}
        <div className="flex justify-center items-center gap-4 text-[10px] sm:text-[11px] text-gray-400 mb-6 font-medium">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> 스트라이커</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 미드필더</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 수비수/골키퍼</span>
        </div>

        {players.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-8 bg-[#36101b] rounded-2xl border border-white/5 max-w-xl mx-auto">등록된 선수가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {players.map((player) => {
              const posInfo = getPositionStyles(player.position);
              return (
                <div key={player.id} className="bg-[#36101b] rounded-2xl p-4 sm:p-5 flex flex-col items-center border border-white/5 shadow-md hover:border-white/10 transition-all text-center">
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center mb-2.5 text-xl bg-black/10 text-gray-400">
                    👤
                  </div>
                  <div className="font-bold text-sm sm:text-base mb-2 text-gray-100 truncate w-full">{player.name}</div>
                  <span className={`text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${posInfo.className}`}>
                    {posInfo.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. 매치 스코어 보드 구역 (아래로 이동 완료 📊) */}
      <section className="max-w-4xl mx-auto px-4 mb-16">
        <h2 className="text-lg sm:text-xl font-bold flex justify-center items-center gap-2 mb-4">📊 최근 경기 결과</h2>
        <div className="relative bg-[#36101b] rounded-2xl border border-white/5 shadow-lg overflow-hidden max-w-xl mx-auto">
          
          {/* 좌측 상단: 연습 경기 뱃지 */}
          {!matchLoading && match?.is_practice && (
            <div className="absolute top-2.5 left-3 text-[9px] font-black tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 text-black px-2 py-0.5 rounded shadow z-10">
              연습 경기 ⚽
            </div>
          )}

          {/* 우측 상단: 경기 결과 컬러풀 뱃지 */}
          {!matchLoading && match?.match_result && (
            <div className={`absolute top-2.5 right-3 text-[9px] font-black tracking-wider px-2 py-0.5 rounded shadow border z-10 ${
              match.match_result === '승리' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              match.match_result === '패배' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              'bg-gray-500/20 text-gray-400 border-gray-500/30'
            }`}>
              {match.match_result}
            </div>
          )}

          <div className="bg-black/20 text-center py-2 text-[11px] font-semibold text-gray-400 tracking-wider border-b border-white/5">
            {displayDate}
          </div>

          {matchLoading ? (
            <div className="text-center py-8 text-xs text-gray-500">스코어 로딩 중...</div>
          ) : (
            <div className="flex items-center justify-between px-4 sm:px-6 py-8">
              <div className="flex flex-col items-center w-5/12 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                  {homeLogoUrl ? <img src={homeLogoUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">🏆</span>}
                </div>
                <span className="font-bold text-xs sm:text-sm text-gray-100 truncate w-full">{displayHomeTeam}</span>
              </div>

              <div className="flex items-center justify-center w-2/12 min-w-[60px]">
                <span className="text-xl sm:text-2xl font-black text-[#d4af37]">{displayHomeScore}</span>
                <span className="text-sm font-bold text-gray-500 mx-1.5 sm:mx-2">:</span>
                <span className="text-xl sm:text-2xl font-black text-gray-400">{displayAwayScore}</span>
              </div>

              <div className="flex flex-col items-center w-5/12 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                  {awayLogoUrl ? <img src={awayLogoUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">🏃</span>}
                </div>
                <span className="font-bold text-xs sm:text-sm text-gray-300 truncate w-full">{displayAwayTeam}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. 연락하기 문의 폼 구역 */}
      <section className="max-w-xl mx-auto px-4 mb-16">
        <h2 className="text-lg sm:text-xl font-bold flex justify-center items-center gap-2 mb-4">✉️ 연락하기</h2>
        <div className="grid grid-cols-2 bg-black/20 rounded-xl p-1 mb-4 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('inquiry')}
            className={`py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'inquiry' ? 'bg-[#d4af37] text-black shadow-md font-black' : 'text-gray-400'
            }`}
          >
            ✉️ 팀 문의
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-2 sm:py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'join' ? 'bg-[#d4af37] text-black shadow-md font-black' : 'text-gray-400'
            }`}
          >
            👤 팀 참가 신청
          </button>
        </div>

        <form onSubmit={handleSendMessage} className="bg-[#36101b] rounded-2xl p-5 sm:p-6 border border-white/5 shadow-lg space-y-4">
          <div>
            <label className="block text-xs text-gray-300 mb-1">이름 *</label>
            <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="홍길동" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">이메일 *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">연락처 *</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">
              {activeTab === 'join' ? '자기소개 및 선호 포지션 *' : '문의 내용 *'}
            </label>
            <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={activeTab === 'join' ? "선호 포지션, 주요 경력 등 어필할 내용을 작성해주세요." : "문의하실 내용을 작성해주세요."} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#d4af37] text-black font-black py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm hover:bg-[#c4a030] disabled:opacity-50 transition-colors">
            {isSubmitting ? '구단 서버 등록 중...' : '🛫 전송하기'}
          </button>
          <p className="text-[10px] text-gray-400 text-center pt-1">
            전송 버튼을 누르면 이메일 앱이 열립니다.
          </p>
        </form>
      </section>

      {/* 6. 푸터 구역 */}
      <footer className="max-w-md mx-auto text-center px-4 mt-8 space-y-4">
        <div className="flex items-center justify-center gap-2 text-gray-300">
          <span className="text-xl">🛡️</span> 
          <span className="font-black text-sm tracking-wider">계비 UTD</span>
        </div>
        <p className="text-[11px] font-bold text-[#d4af37]/70 tracking-widest uppercase">
          WE PLAY. WE FIGHT. WE WIN.
        </p>
        <div className="pt-1">
          <a
            href="https://www.instagram.com/gabby.utd?igsh=YWk4N2FiZGo4Nnht" 
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-xs font-bold px-8 py-2.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
          >
            <span>📸 Instagram</span>
          </a>
        </div>
        <p className="text-[10px] text-gray-500 pt-3">
          © 2026 계비 UTD. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
