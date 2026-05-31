'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
// 🚨 메일 전송용 서버 액션 임포트 (경로 주의: app/actions.ts 기준)
import { sendInquiryEmail } from './actions'; 

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

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  tag: string;
  created_at: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'inquiry' | 'join'>('inquiry');
  const [players, setPlayers] = useState<Player[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [matchLoading, setMatchLoading] = useState<boolean>(true);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [senderName, setSenderName] = useState('');
  const [email, setEmail] = useState(''); 
  const [phone, setPhone] = useState(''); 
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEFAULT_HOME_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/home_icon/home_icon.jpg'; 
  const DEFAULT_AWAY_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg';

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*').order('id', { ascending: true });
      if (!error && data) setPlayers(data);
    };

    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('id', { ascending: false })
          .limit(2);
        if (!error && data) setNews(data);
      } catch (e) {
        console.error("News fetch error on home:", e);
      } finally {
        setNewsLoading(false);
      }
    };

    const fetchMatchData = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('id', { ascending: false })
          .limit(1);
        if (data && data.length > 0 && !error) {
          setMatch(data[0]);
        }
      } catch (e) {
        console.error("Match data fetch error on home:", e);
      } finally {
        setMatchLoading(false);
      }
    };

    fetchPlayers();
    fetchNews();
    fetchMatchData();
  }, []);

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
    if (cleanPos.includes('골키퍼') || cleanPos.toLowerCase().includes('gk')) {
      return { 
        label: '골키퍼', 
        cardClass: 'bg-gradient-to-br from-[#3d3214] to-[#221a0a] border-amber-500/20 hover:border-amber-500/40',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
      };
    }
    return { 
      label: cleanPos || '수비수', 
      cardClass: 'bg-gradient-to-br from-[#162a4c] to-[#0a1428] border-blue-500/20 hover:border-blue-500/40',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
    };
  };

  const getTagStyles = (tag: string) => {
    switch (tag) {
      case '공지': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case '경기결과': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case '이벤트': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // ⭐️ 백엔드 이메일 전송 기능으로 업그레이드 된 메시지 발송 함수
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !email.trim() || !phone.trim() || !content.trim()) {
      return alert('필수 항목(*)을 모두 입력해 주세요.');
    }
    try {
      setIsSubmitting(true);
      
      // 1. 기존 방식: Supabase DB에 백업 저장
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

      // 2. 신규 방식: 서버 액션을 호출해 백엔드에서 메일 발송
      const emailResult = await sendInquiryEmail({
        type: activeTab,
        name: senderName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        content: content.trim()
      });

      if (emailResult.success) {
        alert('Gabby UTD 구단에 정상적으로 접수되었으며, 관리자 메일로 발송되었습니다! 🔥');
        setSenderName('');
        setEmail('');
        setPhone('');
        setContent('');
      } else {
        alert('DB 저장은 완료되었으나, 알림 메일 발송에 실패했습니다: ' + emailResult.message);
      }
    } catch (err) {
      console.error(err);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const displayHomeTeam = match?.home_team || 'Gabby UTD';
  const displayAwayTeam = match?.away_team || '상대 팀';
  const displayHomeScore = match !== null ? match.home_score : 0;
  const displayAwayScore = match !== null ? match.away_score : 0;
  const displayDate = match?.date || '최근 경기 기록';

  const homeLogoUrl = match?.home_logo && match.home_logo.startsWith('http') ? match.home_logo.trim() : DEFAULT_HOME_LOGO;
  const awayLogoUrl = match?.away_logo && match.away_logo.startsWith('http') ? match.away_logo.trim() : DEFAULT_AWAY_LOGO;

  const tem_logo = homeLogoUrl;

  return (
    <div className="bg-[#4a1525] text-white min-h-screen font-sans antialiased selection:bg-[#d4af37] selection:text-black">
      
      {/* 📌 최상단 고정 네비게이션 바 */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div 
            onClick={() => scrollToSection('hero')} 
            className="font-black text-lg tracking-wider text-white hover:text-[#e5c158] transition-colors flex items-center gap-2 cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={homeLogoUrl} 
              alt="Gabby UTD Mini Logo" 
              className="w-6 h-6 object-contain rounded-full bg-black/20 p-0.5"
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }}
            />
            <span>Gabby UTD</span>
          </div>
          <div className="flex gap-5 text-xs sm:text-sm font-bold text-gray-400">
            <div onClick={() => scrollToSection('hero')} className="text-[#e5c158] border-b-2 border-[#e5c158] pb-1 cursor-pointer">메인 홈</div>
            <Link href="/matches" className="hover:text-white transition-colors">MATCHES</Link>
          </div>
        </div>
      </nav>

      {/* 1. 히어로 구역 [배경: 오리지널 와인] */}
      <section id="hero" className="bg-[#4a1525] min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-black/30 border-4 border-[#d4af37] flex items-center justify-center overflow-hidden shadow-2xl mb-6 relative">
          <div className="absolute inset-0 rounded-full border border-[#d4af37]/30 m-2"></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={homeLogoUrl} 
            alt="Club Logo" 
            className="w-full h-full object-cover z-10" 
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }}
          />
        </div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">{displayHomeTeam}</h1>
        <p className="text-[#d4af37] text-lg sm:text-xl font-bold tracking-widest mb-6">
          열정과 함께, 끝까지 승리를 위하여
        </p>
        <p className="text-gray-300 text-sm mb-12">2026 구단 공식 프리미엄 대시보드</p>

        <button 
          onClick={() => scrollToSection('about')}
          className="bg-[#d4af37] text-black font-bold py-3.5 px-8 rounded-full flex items-center gap-2 hover:bg-[#c4a030] transition-transform hover:scale-105 active:scale-95 shadow-xl"
        >
          구단 알아보기 
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </section>

      {/* 2. 팀 소개 구역 [배경: 다크 와인] */}
      <section id="about" className="bg-[#330d19] w-full py-20 border-t border-b border-black/10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-[#240811] rounded-2xl p-8 sm:p-10 border border-white/5 shadow-xl text-center leading-relaxed text-gray-200 text-base">
            <strong className="text-[#d4af37] text-sm font-bold tracking-[0.2em] block mb-3 uppercase">ABOUT TEAM</strong>
            <span className="font-medium text-gray-300 leading-loose">
              <strong className="text-white text-lg block mb-2">{displayHomeTeam}</strong> 
              타협하지 않는 열정의 축구단입니다. <br/>
              언제나 최고의 경기력과 끈끈한 팀워크로<br/>승리를 향해 전진합니다.
            </span>
          </div>
        </div>
      </section>

      {/* 3. 최근 구단 소식 섹션 [배경: 오리지널 와인] */}
      <section id="news" className="bg-[#4a1525] w-full py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#e5c158] flex items-center gap-2">📰 최근 소식</h2>
            <Link href="/news" className="text-xs font-bold text-gray-400 hover:text-[#d4af37] transition-colors bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
              전체보기 ➔
            </Link>
          </div>

          {newsLoading ? (
            <div className="text-center py-8 text-xs text-gray-400">최신 소식을 로딩 중...</div>
          ) : news.length === 0 ? (
            <div className="text-center py-8 bg-[#36101b] rounded-2xl border border-white/5 text-xs text-gray-400">
              등록된 구단 소식이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <Link href="/news" key={item.id} className="block bg-[#36101b] border border-white/5 hover:border-white/20 p-5 rounded-2xl shadow-xl transition-all group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border ${getTagStyles(item.tag)}`}>
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(item.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <h3 className="font-black text-sm sm:text-base text-white group-hover:text-[#e5c158] truncate transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                    {item.image_url && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/20 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt="News thumbnail" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. 선수 명단 구역 [배경: 다크 와인] */}
      <section id="players" className="bg-[#330d19] w-full py-20 border-t border-b border-black/10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-center flex justify-center items-center gap-2 mb-3 text-[#e5c158]">
            👥 선수 명단
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-300 mb-8 font-semibold bg-black/30 py-2 px-6 rounded-full w-fit mx-auto border border-white/5">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600" /> 스트라이커</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600" /> 미드필더</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600" /> 수비수</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> 골키퍼</span>
          </div>

          {players.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-12 bg-[#240811] rounded-2xl border border-white/5 max-w-xl mx-auto">선수 명단이 비어있습니다.</p>
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
        </div>
      </section>

      {/* 5. 매치 스코어 보드 구역 [배경: 오리지널 와인] */}
      <section id="match" className="bg-[#4a1525] w-full py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-[#e5c158] flex items-center gap-2">
              🏆 최근 경기 결과
            </h2>
            <Link 
              href="/matches" 
              className="text-xs font-black text-[#d4af37] hover:text-amber-300 bg-black/30 hover:bg-black/50 border border-[#d4af37]/40 px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow-md"
            >
              📊 매치 더 보기 ➔
            </Link>
          </div>

          <div className="relative bg-[#36101b] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
              <span className={`text-[10px] sm:text-xs font-black tracking-widest px-3 py-1 rounded-md shadow ${
                match?.is_practice ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
              }`}>
                {match?.is_practice ? '연습경기' : '공식매치'}
              </span>
            </div>

            <div className="absolute top-4 right-4 z-10">
              <span className={`text-[10px] sm:text-xs font-black tracking-widest px-3 py-1 rounded-md shadow border ${
                match?.match_result === '패배' ? 'bg-red-600/30 text-red-400 border-red-500/40' : 
                match?.match_result === '무승부' ? 'bg-gray-600/30 text-gray-300 border-gray-500/40' :
                'bg-green-600/30 text-green-400 border-green-500/40'
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
                <div className="flex flex-col items-center w-5/12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center overflow-hidden mb-3 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={homeLogoUrl} className="w-full h-full object-cover" alt="Home Team" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }} />
                  </div>
                  <span className="font-black text-base sm:text-xl text-amber-400 tracking-wide truncate w-full">{displayHomeTeam}</span>
                </div>

                <div className="flex flex-col items-center justify-center w-2/12 min-w-[100px]">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl sm:text-5xl font-black text-[#d4af37] bg-black/40 px-4 py-2 rounded-xl shadow-md">{displayHomeScore}</span>
                    <span className="text-2xl font-bold text-gray-500">-</span>
                    <span className="text-3xl sm:text-5xl font-black text-white bg-black/40 px-4 py-2 rounded-xl shadow-md">{displayAwayScore}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center w-5/12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center overflow-hidden mb-3 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={awayLogoUrl} className="w-full h-full object-cover" alt="Away Team" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AWAY_LOGO; }} />
                  </div>
                  <span className="font-black text-base sm:text-xl text-white tracking-wide truncate w-full">{displayAwayTeam}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. 연락하기 문의 폼 구역 [배경: 다크 와인] */}
      <section id="contact" className="bg-[#330d19] w-full py-20 border-t border-black/10">
        <div className="max-w-2xl mx-auto px-4">
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

          <form onSubmit={handleSendMessage} className="bg-[#240811] rounded-2xl p-6 border border-white/5 shadow-lg space-y-4">
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
              {isSubmitting ? '전송 처리 중...' : '🛫 전송하기'}
            </button>
            <p className="text-[11px] text-gray-400 text-center pt-1">
              전송 버튼을 누르면 구단 관리자 이메일로 즉시 알림이 발송됩니다.
            </p>
          </form>
        </div>
      </section>

      {/* 7. 푸터 구역 [배경: 가장 어두운 딥 와인] */}
      <footer className="bg-[#210810] w-full py-12 border-t border-white/5">
        <div className="max-w-md mx-auto text-center px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <div className="w-8 h-8 rounded-full bg-black/20 p-0.5 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tem_logo} alt="Footer Club Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }} />
            </div>
            <span className="font-black text-base tracking-wider">{displayHomeTeam}</span>
          </div>
          <p className="text-xs font-bold text-[#d4af37]/70 tracking-widest uppercase">
            열정과 함께, 끝까지 승리를 위하여.
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
            © 2026 {displayHomeTeam}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}