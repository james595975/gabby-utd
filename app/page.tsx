'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase'; // 구단주님의 기존 utils 폴더 경로 유지

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
  is_practice: boolean; // 💡 연습 경기 상태 타입 정의 반영
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
      const { data, error } = await supabase.from('players').select('*');
      if (!error && data) setPlayers(data);
    };

    const fetchMatchData = async () => {
      const { data, error } = await supabase
        .schema('public')
        .from('matches')
        .select('*');

      if (data && data.length > 0 && !error) {
        setMatch(data[0]);
      }
      setMatchLoading(false);
    };

    fetchPlayers();
    fetchMatchData();
  }, []);

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
        <div className="w-40 h-40 rounded-full bg-black/30 border-4 border-[#d4af37] flex items-center justify-center overflow-hidden shadow-2xl mb-6">
          {homeLogoUrl ? (
            <img src={homeLogoUrl} alt="Club Logo" className="w-full h-full object-cover" key={homeLogoUrl} />
          ) : (
            <span className="text-gray-300 text-xs font-bold text-center px-2">계비 UTD<br/>로고</span>
          )}
        </div>
        <h1 className="text-4xl font-black tracking-wider mb-2">계비 UTD</h1>
        <p className="text-[#d4af37] text-lg font-bold tracking-widest mb-4">WE PLAY. WE FIGHT. WE WIN.</p>
        <p className="text-gray-300 text-sm">2026년 창립 | 열정과 도전의 축구팀</p>
      </section>

      {/* 2. 팀 소개 */}
      <section className="max-w-md mx-auto px-4 mb-12">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">🛡️ 팀 소개</h2>
        <div className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg text-center leading-relaxed text-gray-200 text-sm">
          <strong className="text-[#d4af37]">계비 UTD</strong>는 열정 넘치는 축구팀입니다. 
          "WE PLAY. WE FIGHT. WE WIN."이라는 모토 아래, 팀원들과 함께 경기를 즐기며 성장하고 있습니다.
        </div>
      </section>

      {/* 3. 선수 명단 */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">👥 선수 명단 ({players.length}명)</h2>
        {players.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6 bg-[#36101b] rounded-2xl border border-white/5">등록된 선수가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {players.map((player) => (
              <div key={player.id} className="bg-[#36101b] rounded-2xl p-6 flex flex-col items-center border border-white/5 shadow-md">
                <div className="w-14 h-14 rounded-full border-2 border-[#d4af37]/50 flex items-center justify-center mb-3 text-2xl bg-black/10">👤</div>
                <div className="font-bold text-base mb-2">{player.name}</div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`}>
                  {player.position}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. 매치 스코어 보드 (💡 연습 경기 조건부 뱃지 디자인 반영) */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">📊 최근 경기 결과</h2>
        <div className="relative bg-[#36101b] rounded-2xl border border-white/5 shadow-lg overflow-hidden mb-6">
          
          {/* 💡 [연습 경기 뱃지] 데이터베이스의 is_practice 속성이 true일 때만 노출되는 레이어 마크 */}
          {!matchLoading && match?.is_practice && (
            <div className="absolute top-2.5 left-3 text-[9px] font-black tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 text-black px-2 py-0.5 rounded shadow border border-amber-400/20 z-10 animate-fade-in">
              연습 경기 ⚽
            </div>
          )}

          <div className="bg-black/20 text-center py-2 text-[11px] font-semibold text-gray-400 tracking-wider border-b border-white/5">
            {displayDate}
          </div>

          {matchLoading ? (
            <div className="text-center py-8 text-xs text-gray-500">스코어 로딩 중...</div>
          ) : (
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex flex-col items-center w-5/12 text-center">
                <div className="w-14 h-14 rounded-full bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                  {homeLogoUrl ? <img src={homeLogoUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">🏆</span>}
                </div>
                <span className="font-bold text-sm text-gray-100 truncate w-full">{displayHomeTeam}</span>
              </div>

              <div className="flex items-center justify-center w-2/12">
                <span className="text-2xl font-black text-[#d4af37]">{displayHomeScore}</span>
                <span className="text-sm font-bold text-gray-500 mx-2">:</span>
                <span className="text-2xl font-black text-gray-400">{displayAwayScore}</span>
              </div>

              <div className="flex flex-col items-center w-5/12 text-center">
                <div className="w-14 h-14 rounded-full bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                  {awayLogoUrl ? <img src={awayLogoUrl} className="w-full h-full object-cover" /> : <span className="text-2xl">🏃</span>}
                </div>
                <span className="font-bold text-sm text-gray-300 truncate w-full">{displayAwayTeam}</span>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* 5. 연락하기 문의 폼 구역 */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">✉️ 연락하기</h2>
        
        <div className="grid grid-cols-2 bg-black/20 rounded-xl p-1 mb-4 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('inquiry')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'inquiry' ? 'bg-[#d4af37] text-black shadow-md' : 'text-gray-400'
            }`}
          >
            ✉️ 팀 문의
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'join' ? 'bg-[#d4af37] text-black shadow-md' : 'text-gray-400'
            }`}
          >
            👤 팀 참가 신청
          </button>
        </div>

        <form onSubmit={handleSendMessage} className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg space-y-4">
          <div>
            <label className="block text-xs text-gray-300 mb-1">이름 *</label>
            <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="홍길동" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">이메일 *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">연락처 *</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          </div>

          <div>
            <label className="block text-xs text-gray-300 mb-1">
              {activeTab === 'join' ? '자기소개 및 선호 포지션 *' : '문의 내용 *'}
            </label>
            <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={activeTab === 'join' ? "선호 포지션, 주요 경력 등 어필할 내용을 작성해주세요." : "문의하실 내용을 작성해주세요."} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#d4af37] text-black font-bold py-3.5 rounded-xl text-sm hover:bg-[#c4a030] disabled:opacity-50 transition-colors">
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