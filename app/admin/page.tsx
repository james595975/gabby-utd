'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
// 🚨 빠른 페이지 이동을 위한 Link 컴포넌트 추가
import Link from 'next/link'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Player {
  id: number;
  name: string;
  position: string;
}

interface MatchData {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_logo?: string;
  away_logo?: string;
  date?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'inquiry' | 'join'>('inquiry');
  const [players, setPlayers] = useState<Player[]>([]);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [matchLoading, setMatchLoading] = useState<boolean>(true);
  
  const [senderName, setSenderName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) setPlayers(data);
    };

    const fetchMatchData = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('home_team, away_team, home_score, away_score, home_logo, away_logo, date')
        .eq('id', 1)
        .single();

      if (data && !error) setMatch(data);
      setMatchLoading(false);
    };

    fetchPlayers();
    fetchMatchData();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !content.trim()) return alert('이름과 내용을 모두 입력해 주세요.');
    setIsSubmitting(true);
    const { error } = await supabase.from('messages').insert([{ type: activeTab, name: senderName, content: content }]);
    setIsSubmitting(false);
    if (error) {
      alert('전송에 실패했습니다: ' + error.message);
    } else {
      alert('계비 UTD 구단주에게 메시지가 성공적으로 전송되었습니다! 🔥');
      setSenderName(''); setContent('');
    }
  };

  const displayHomeTeam = match?.home_team || '계비 UTD';
  const displayAwayTeam = match?.away_team || '잔뇨 FC';
  const displayHomeScore = match?.home_score ?? 7;
  const displayAwayScore = match?.away_score ?? 2;
  const displayDate = match?.date || '최근 경기 결과';

  return (
    <div className="bg-[#4a1525] text-white min-h-screen font-sans antialiased">
      
      {/* 1. 히어로 섹션 */}
      <section className="flex flex-col items-center justify-center text-center pt-20 pb-16 px-4">
        <div className="w-40 h-40 rounded-full bg-black/30 border-4 border-[#d4af37] flex items-center justify-center overflow-hidden shadow-2xl mb-6">
          {match?.home_logo ? (
            <img src={match.home_logo} alt="Club Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-300 text-sm font-bold">계비 UTD 로고</span>
          )}
        </div>
        <h1 className="text-4xl font-black tracking-wider mb-2">계비 UTD</h1>
        <p className="text-[#d4af37] text-lg font-bold tracking-widest mb-4">WE PLAY. WE FIGHT. WE WIN.</p>
        <p className="text-gray-300 text-sm">2026년 창립 | 열정과 도전의 축구팀</p>
      </section>

      {/* 2. ทีม 소개 섹션 */}
      <section className="max-w-md mx-auto px-4 mb-12">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">🛡️ 팀 소개</h2>
        <div className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg text-center leading-relaxed text-gray-200 text-sm">
          <strong className="text-[#d4af37]">계비 UTD</strong>는 열정 넘치는 축구팀입니다. 
          "WE PLAY. WE FIGHT. WE WIN."이라는 모토 아래, 팀원들과 함께 경기를 즐기며 성장하고 있습니다.
        </div>
      </section>

      {/* 2.5 최근 경기 결과 섹션 */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">📊 최근 경기 결과</h2>
        <div className="bg-[#36101b] rounded-2xl border border-white/5 shadow-lg overflow-hidden">
          <div className="bg-black/20 text-center py-2 text-[11px] font-semibold text-gray-400 tracking-wider border-b border-white/5">
            {displayDate}
          </div>

          {matchLoading ? (
            <div className="text-center py-8 text-xs text-gray-500">스코어 로딩 중...</div>
          ) : (
            <>
              <div className="flex items-center justify-between px-6 py-6">
                {/* 홈팀 */}
                <div className="flex flex-col items-center w-5/12 text-center">
                  <div className="w-14 h-14 rounded-full bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                    {match?.home_logo ? <img src={match.home_logo} className="w-full h-full object-cover" /> : <span className="text-2xl">🏆</span>}
                  </div>
                  <span className="font-bold text-sm text-gray-100 truncate w-full">{displayHomeTeam}</span>
                  {displayHomeScore > displayAwayScore && (
                    <span className="text-[9px] bg-[#d4af37]/20 text-[#d4af37] font-bold px-1.5 py-0.5 rounded mt-1">WIN</span>
                  )}
                </div>

                {/* 스코어 */}
                <div className="flex items-center justify-center w-2/12">
                  <span className={`text-2xl font-black ${displayHomeScore > displayAwayScore ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                    {displayHomeScore}
                  </span>
                  <span className="text-sm font-bold text-gray-500 mx-2">:</span>
                  <span className={`text-2xl font-black ${displayAwayScore > displayHomeScore ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                    {displayAwayScore}
                  </span>
                </div>

                {/* 어웨이팀 */}
                <div className="flex flex-col items-center w-5/12 text-center">
                  <div className="w-14 h-14 rounded-full bg-black/20 border border-white/10 flex items-center justify-center overflow-hidden mb-2 shadow-inner">
                    {match?.away_logo ? <img src={match.away_logo} className="w-full h-full object-cover" /> : <span className="text-2xl">🏃</span>}
                  </div>
                  <span className="font-bold text-sm text-gray-300 truncate w-full">{displayAwayTeam}</span>
                  {displayAwayScore > displayHomeScore && (
                    <span className="text-[9px] bg-[#d4af37]/20 text-[#d4af37] font-bold px-1.5 py-0.5 rounded mt-1">WIN</span>
                  )}
                </div>
              </div>

              {/* ⭐️ 하단에 신설된 [매치 수정하러 가기] 관리자 바로가기 버튼 */}
              <div className="px-6 pb-4 pt-2 border-t border-white/5 bg-black/10 flex justify-center">
                <Link 
                  href="/admin/match" 
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#d4af37] border border-[#d4af37]/30 bg-[#d4af37]/5 px-4 py-2 rounded-xl transition-all hover:bg-[#d4af37]/20 active:scale-95"
                >
                  ⚙️ 매치 수정하러 가기
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 3. 선수 명단 섹션 */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">👥 선수 명단 ({players.length}명)</h2>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-400 mb-6">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> 스트라이커</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> 미드필더</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 수비수</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> 골키퍼</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {players.map((player) => (
            <div key={player.id} className="bg-[#36101b] rounded-2xl p-6 flex flex-col items-center border border-white/5 shadow-md">
              <div className="w-14 h-14 rounded-full border-2 border-[#d4af37]/50 flex items-center justify-center mb-3 text-2xl bg-black/10">👤</div>
              <div className="font-bold text-base mb-2">{player.name}</div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                player.position === '스트라이커' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                player.position === '미드필더' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                player.position === '수비수' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>{player.position}</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* 4. 연락하기 섹션 */}
      <section className="max-w-md mx-auto px-4 pb-20">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">✉️ 연락하기</h2>
        <div className="flex bg-black/20 p-1 rounded-xl mb-4">
          <button onClick={() => { setActiveTab('inquiry'); setContent(''); }} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'inquiry' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400'}`}>📩 팀 문의</button>
          <button onClick={() => { setActiveTab('join'); setContent(''); }} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'join' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400'}`}>👤 팀 참가 신청</button>
        </div>
        <form onSubmit={handleSendMessage} className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg space-y-4">
          <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="이름 또는 팀명 *" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
          <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder={activeTab === 'inquiry' ? "연락처(전화번호)와 문의하실 내용을 작성해주세요." : "나이, 포지션, 연락처 등 자기소개를 작성해주세요."} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
          <button type="submit" disabled={isSubmitting} className="w-full bg-[#d4af37] text-black font-bold py-3.5 rounded-xl text-sm shadow-md hover:bg-[#c4a030] transition-colors disabled:opacity-50">{isSubmitting ? '전송 중...' : '🚀 전송하기'}</button>
        </form>
      </section>
    </div>
  );
}