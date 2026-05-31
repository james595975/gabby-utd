'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface Player { id: number; name: string; position: string; }
interface Message { id: number; type: string; name: string; content: string; created_at?: string; }
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
  link_url?: string;
  tag: string;
  created_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 경기 결과 수정 관련 상태
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeLogo, setHomeLogo] = useState(''); // 🔥 수정 폼용 홈 로고 추가
  const [awayLogo, setAwayLogo] = useState(''); // 🔥 수정 폼용 원정 로고 추가
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [isPractice, setIsPractice] = useState(false); 
  const [matchResult, setMatchResult] = useState('무승부'); 

  // 신규 경기 추가 등록 관련 상태
  const [addHomeTeam, setAddHomeTeam] = useState('계비 UTD');
  const [addAwayTeam, setAddAwayTeam] = useState('');
  const [addHomeScore, setAddHomeScore] = useState(0);
  const [addAwayScore, setAddAwayScore] = useState(0);
  const [addHomeLogo, setAddHomeLogo] = useState(''); // 🔥 신규 등록용 홈 로고
  const [addAwayLogo, setAddAwayLogo] = useState(''); // 🔥 신규 등록용 원정 로고
  const [addIsPractice, setAddIsPractice] = useState(false);
  const [addMatchResult, setAddMatchResult] = useState('무승부');

  // 신규 선수 등록 관련 상태
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('미드필더');

  // 구단 소식 등록 및 수정 관련 상태
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsTag, setNewsTag] = useState('공지');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsLinkUrl, setNewsLinkUrl] = useState('');

  // 문의/신청 리스트 분류 필터 상태
  const [messageFilter, setMessageFilter] = useState<'all' | 'join' | 'inquiry'>('all');

  useEffect(() => {
    const isSavedLogin = localStorage.getItem('gb_admin_authenticated');
    if (isSavedLogin === 'true') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (password === adminPassword) {
      localStorage.setItem('gb_admin_authenticated', 'true');
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gb_admin_authenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

  const fetchData = async () => {
    try {
      setIsLoading(false);
      const { data: pData } = await supabase.from('players').select('*').order('id', { ascending: true });
      if (pData) setPlayers(pData);

      const { data: mData } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (mData) setMessages(mData);

      const { data: matchData, error: matchError } = await supabase.from('matches').select('*').order('id', { ascending: false });
      if (matchData && !matchError) setMatches(matchData);

      const { data: newsData, error: newsError } = await supabase.from('news').select('*').order('id', { ascending: false });
      if (newsData && !newsError) setNews(newsData);
    } catch (e) {
      console.error(e);
    }
  };

  // ⚽ 새로운 경기 추가 기능
  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addHomeTeam.trim() || !addAwayTeam.trim()) {
      return alert('홈 팀명과 원정 팀명은 필수 항목입니다.');
    }

    try {
      const { error } = await supabase
        .from('matches')
        .insert([
          {
            home_team: addHomeTeam.trim(),
            away_team: addAwayTeam.trim(),
            home_score: Number(addHomeScore),
            away_score: Number(addAwayScore),
            home_logo: addHomeLogo.trim() || null, // 🛡️ 주소 없으면 null로 전달하여 메인에서 기본 아이콘이 뜨도록 유도
            away_logo: addAwayLogo.trim() || null,
            is_practice: addIsPractice,
            match_result: addMatchResult
          }
        ]);

      if (error) {
        alert("경기 등록 실패: " + error.message);
      } else {
        alert("새로운 경기 결과가 성공적으로 등록되었습니다! ⚽");
        setAddAwayTeam('');
        setAddHomeScore(0);
        setAddAwayScore(0);
        setAddHomeLogo(''); // 🔥 입력창 비우기
        setAddAwayLogo(''); // 🔥 입력창 비우기
        setAddIsPractice(false);
        setAddMatchResult('무승부');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 경기 결과 업데이트 (Update)
  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatchId) return;

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          home_team: homeTeam.trim(),
          away_team: awayTeam.trim(),
          home_score: Number(homeScore),
          away_score: Number(awayScore),
          home_logo: homeLogo.trim() || null, // 🔥 수정 반영
          away_logo: awayLogo.trim() || null, // 🔥 수정 반영
          is_practice: isPractice,
          match_result: matchResult
        })
        .eq('id', editingMatchId);

      if (error) {
        alert("수정 실패: " + error.message);
      } else {
        alert("경기 결과가 성공적으로 업데이트되었습니다! ⚽");
        setEditingMatchId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 경기 삭제 기능
  const handleDeleteMatch = async (id: number, home: string, away: string) => {
    if (!confirm(`[${home} vs ${away}] 경기를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (!error) fetchData();
  };

  // 선수 추가 기능
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return alert('선수 이름을 입력해 주세요.');
    const { error } = await supabase
      .from('players')
      .insert([{ name: newPlayerName.trim(), position: newPlayerPosition }]);
    if (!error) {
      setNewPlayerName('');
      fetchData();
    } else {
      alert('선수 등록 실패: ' + error.message);
    }
  };

  // 선수 삭제 기능
  const handleDeletePlayer = async (id: number, name: string) => {
    if (!confirm(`${name} 선수를 구단 명단에서 제외하시겠습니까?`)) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (!error) fetchData();
  };

  // 소식 등록 및 수정 제출 통합 핸들러
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      return alert('제목과 내용은 필수 항목입니다.');
    }

    const payload = {
      title: newsTitle.trim(),
      content: newsContent.trim(),
      tag: newsTag,
      image_url: newsImageUrl.trim() || null,
      link_url: newsLinkUrl.trim() || null
    };

    if (editingNewsId) {
      const { error } = await supabase.from('news').update(payload).eq('id', editingNewsId);
      if (!error) {
        alert('구단 소식이 성공적으로 수정되었습니다! 📝');
        cancelNewsEdit();
        fetchData();
      } else {
        alert('소식 수정 실패: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('news').insert([payload]);
      if (!error) {
        alert('새로운 소식이 성공적으로 등록되었습니다! 📰');
        cancelNewsEdit();
        fetchData();
      } else {
        alert('소식 등록 실패: ' + error.message);
      }
    }
  };

  const startEditNews = (item: NewsItem) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title);
    setNewsContent(item.content);
    setNewsTag(item.tag);
    setNewsImageUrl(item.image_url || '');
    setNewsLinkUrl(item.link_url || '');
  };

  const cancelNewsEdit = () => {
    setEditingNewsId(null);
    setNewsTitle('');
    setNewsContent('');
    setNewsTag('공지');
    setNewsImageUrl('');
    setNewsLinkUrl('');
  };

  const handleDeleteNews = async (id: number, title: string) => {
    if (!confirm(`"${title}" 소식을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) {
      if (editingNewsId === id) cancelNewsEdit();
      fetchData();
    }
  };

  const handleDeleteMessage = async (id: number, name: string) => {
    if (!confirm(`"${name}" 님의 문의/지원 내역을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) fetchData();
  };

  const startEdit = (match: MatchData) => {
    setEditingMatchId(match.id);
    setHomeScore(match.home_score);
    setAwayScore(match.away_score);
    setHomeLogo(match.home_logo && match.home_logo !== "🛡️" ? match.home_logo : ''); // 기설정된 이모지가 있다면 주소칸을 깔끔하게 비워줌
    setAwayLogo(match.away_logo && match.away_logo !== "🛡️" ? match.away_logo : '');
    setHomeTeam(match.home_team || '계비 UTD');
    setAwayTeam(match.away_team || '');
    setIsPractice(match.is_practice || false);
    setMatchResult(match.match_result || '무승부');
  };

  const filteredMessages = messages.filter((msg) => {
    if (messageFilter === 'all') return true;
    return msg.type === messageFilter;
  });

  if (!isAuthenticated) {
    return (
      <div className="bg-[#1e060c] min-h-screen flex items-center justify-center text-white px-4">
        <form onSubmit={handleLogin} className="bg-[#36101b] p-8 rounded-2xl shadow-xl w-full max-w-sm border border-white/5">
          <h2 className="text-xl font-bold mb-6 text-center text-[#d4af37]">구단 관리자 로그인</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm mb-4 text-center focus:outline-none focus:border-[#d4af37]" />
          <button type="submit" className="w-full bg-[#d4af37] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#c4a030]">입장하기</button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#1e060c] min-h-screen text-white p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 상단 헤더 로우 */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-[#d4af37]">🛡️ 구단 매니저 센터</h1>
          <button onClick={handleLogout} className="text-xs bg-red-900/40 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold">로그아웃</button>
        </div>

        {/* [1구역] 경기 스코어 관리 */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md space-y-5">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">📊 경기 매치 결과 관리 ({matches.length}건)</h2>
          
          {/* 1-1. 신규 경기 결과 추가 등록 폼 (로고 주소칸 추가 완료) */}
          <form onSubmit={handleAddMatch} className="bg-black/20 p-4 rounded-xl border border-dashed border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1">➕ 새로운 경기 결과 추가 등록</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">홈 팀 명 *</label>
                <input type="text" value={addHomeTeam} onChange={(e) => setAddHomeTeam(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white focus:border-[#d4af37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">원정 팀 명 *</label>
                <input type="text" value={addAwayTeam} onChange={(e) => setAddAwayTeam(e.target.value)} placeholder="상대 팀 이름" className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white focus:border-[#d4af37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">홈 스코어</label>
                <input type="number" value={addHomeScore} onChange={(e) => setAddHomeScore(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white focus:border-[#d4af37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">원정 스코어</label>
                <input type="number" value={addAwayScore} onChange={(e) => setAddAwayScore(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white focus:border-[#d4af37] focus:outline-none" />
              </div>
              
              {/* 🔥 추가: 신규 등록용 홈/원정 로고 URL 입력칸 */}
              <div>
                <label className="block text-[10px] text-amber-400 font-bold mb-1">홈 팀 로고 URL (이미지 주소)</label>
                <input type="text" value={addHomeLogo} onChange={(e) => setAddHomeLogo(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-black/40 border border-[#d4af37]/30 p-2 rounded text-xs text-white focus:border-[#d4af37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">원정 팀 로고 URL (이미지 주소)</label>
                <input type="text" value={addAwayLogo} onChange={(e) => setAddAwayLogo(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white focus:border-[#d4af37] focus:outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1 flex-wrap sm:flex-nowrap justify-between">
              <div className="flex items-center gap-1.5">
                <input type="checkbox" id="addIsPractice" checked={addIsPractice} onChange={(e) => setAddIsPractice(e.target.checked)} className="w-4 h-4 accent-[#d4af37] cursor-pointer" />
                <label htmlFor="addIsPractice" className="text-xs font-bold text-amber-400 cursor-pointer">🛠️ 연습 매치(친선전)로 표시</label>
              </div>

              <div className="flex gap-4 items-center">
                <span className="text-[10px] text-gray-400 font-bold">🎯 최종 결과:</span>
                {['승리', '패배', '무승부'].map((res) => (
                  <label key={res} className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                    <input type="radio" name="addResultGroup" value={res} checked={addMatchResult === res} onChange={(e) => setAddMatchResult(e.target.value)} className="accent-[#d4af37]" />
                    {res === '승리' ? '🟢 승' : res === '패배' ? '🔴 패' : '⚪ 무'}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl text-xs transition-colors">
              ✨ 신규 경기 데이터베이스에 저장하기
            </button>
          </form>

          {/* 1-2. 기존 매치 리스트 수정/삭제 목록 */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {matches.map((m) => (
              <div key={m.id} className="border border-white/5 p-4 rounded-xl bg-black/10">
                {editingMatchId === m.id ? (
                  <form onSubmit={handleUpdateMatch} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">홈 팀 명</label>
                        <input type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">원정 팀 명</label>
                        <input type="text" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">홈 스코어</label>
                        <input type="number" value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">원정 스코어</label>
                        <input type="number" value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white" />
                      </div>
                      
                      {/* 🔥 추가: 기존 데이터 수정 폼용 홈/원정 로고 URL 입력칸 */}
                      <div>
                        <label className="block text-[10px] text-amber-400 font-bold mb-1">홈 팀 로고 URL 수정</label>
                        <input type="text" value={homeLogo} onChange={(e) => setHomeLogo(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-black/40 border border-[#d4af37]/30 p-2 rounded text-xs text-white focus:border-[#d4af37]" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">원정 팀 로고 URL 수정</label>
                        <input type="text" value={awayLogo} onChange={(e) => setAwayLogo(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white focus:border-[#d4af37]" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" id="isPractice" checked={isPractice} onChange={(e) => setIsPractice(e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                      <label htmlFor="isPractice" className="text-xs font-bold text-amber-400 cursor-pointer">🛠️ 연습 경기 매치로 표시</label>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <div className="flex gap-4 items-center">
                        {['승리', '패배', '무승부'].map((res) => (
                          <label key={res} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                            <input type="radio" name="resultGroup" value={res} checked={matchResult === res} onChange={(e) => setMatchResult(e.target.value)} className="accent-[#d4af37]" />
                            {res === '승리' ? '🟢 승리' : res === '패배' ? '🔴 패배' : '⚪ 무승부'}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded text-xs text-black font-black">💾 수정 완료</button>
                      <button type="button" onClick={() => setEditingMatchId(null)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-xs font-medium">취소</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="text-xs sm:text-sm flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                        m.match_result === '승리' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        m.match_result === '패배' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-gray-600/20 text-gray-400 border-gray-600/30'
                      }`}>{m.match_result || '무승부'}</span>
                      {m.is_practice && <span className="text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1 rounded">친선</span>}
                      <span className="font-bold text-[#d4af37]">{m.home_team || '계비 UTD'}</span> 
                      <span className="font-mono bg-black/40 px-2 py-0.5 rounded font-bold text-white">{m.home_score} : {m.away_score}</span> 
                      <span className="text-gray-300">{m.away_team}</span>
                      
                      {/* 미니 로고 등록 여부 표시 */}
                      <span className="text-[9px] text-gray-500">
                        {m.home_logo && m.home_logo.startsWith('http') ? '🏠🖼️' : ''}
                        {m.away_logo && m.away_logo.startsWith('http') ? '🏃🖼️' : ''}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => startEdit(m)} className="bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1.5 rounded text-xs font-bold transition-colors">수정</button>
                      <button onClick={() => handleDeleteMatch(m.id, m.home_team || '홈', m.away_team || '원정')} className="bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/10 px-2.5 py-1.5 rounded text-xs font-bold transition-colors">삭제</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* [2구역] 구단 소식 게시판 포스팅 및 수정 관리 */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md space-y-4">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            {editingNewsId ? '📝 선택한 구단 소식 수정 중' : '📰 구단 소식 포스팅 관리'} ({news.length}건)
          </h2>
          <form onSubmit={handleSaveNews} className={`space-y-3 p-4 rounded-xl border ${editingNewsId ? 'bg-amber-500/5 border-amber-500/30' : 'bg-black/20 border-white/5'}`}>
            {editingNewsId && (
              <div className="text-xs text-amber-400 font-bold flex justify-between items-center bg-amber-500/10 p-2 rounded-lg mb-2">
                <span>⚠️ 현재 ID: {editingNewsId}번 글을 수정 중입니다.</span>
                <button type="button" onClick={cancelNewsEdit} className="text-white underline bg-black/30 px-2 py-0.5 rounded">수정 취소</button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-gray-400 mb-1">소식 제목 *</label>
                <input type="text" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">분류 태그</label>
                <select value={newsTag} onChange={(e) => setNewsTag(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none cursor-pointer">
                  <option value="공지">🚨 공지사항</option>
                  <option value="경기결과">⚽ 경기결과</option>
                  <option value="이벤트">🎉 이벤트/행사</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">대표 이미지 주소 (선택)</label>
                <input type="text" value={newsImageUrl} onChange={(e) => setNewsImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
              </div>
              <div>
                <label className="block text-[10px] text-amber-400 font-bold mb-1">🔗 클릭 시 이동할 상세 링크 주소 (선택)</label>
                <input type="text" value={newsLinkUrl} onChange={(e) => setNewsLinkUrl(e.target.value)} placeholder="https://instagram.com/... (링크 주소)" className="w-full bg-black/40 border border-amber-500/20 focus:border-[#d4af37] rounded-xl p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 mb-1">본문 내용 *</label>
              <textarea rows={3} value={newsContent} onChange={(e) => setNewsContent(e.target.value)} placeholder="구단원들에게 공유할 상세 내용을 적어주세요." className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
            </div>

            <div className="flex gap-2">
              <button type="submit" className={`flex-1 font-black py-2.5 rounded-xl text-xs transition-colors text-black ${editingNewsId ? 'bg-amber-400 hover:bg-amber-500' : 'bg-[#d4af37] hover:bg-[#c4a030]'}`}>
                {editingNewsId ? '💾 수정 사항 저장하기' : '🚀 새로운 소식 발행하기'}
              </button>
              {editingNewsId && (
                <button type="button" onClick={cancelNewsEdit} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold">취소</button>
              )}
            </div>
          </form>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {news.map((item) => (
              <div key={item.id} className={`border p-3 rounded-xl flex justify-between items-center gap-4 text-xs transition-colors ${editingNewsId === item.id ? 'bg-amber-500/10 border-amber-500/40' : 'bg-black/10 border-white/5'}`}>
                <div className="truncate space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-black/40 text-gray-400 px-1.5 py-0.5 rounded font-mono">ID: {item.id}</span>
                    <span className="text-[10px] text-amber-300 font-bold">[{item.tag}]</span>
                    {item.link_url && <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded border border-amber-500/20">🔗 링크 있음</span>}
                    <span className="text-gray-400 text-[10px]">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-bold text-gray-200 truncate">{item.title}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => startEditNews(item)} className="text-[10px] text-amber-400 bg-amber-950/20 hover:bg-amber-900/40 px-2.5 py-1.5 rounded-lg border border-amber-500/10 font-bold">수정</button>
                  <button type="button" onClick={() => handleDeleteNews(item.id, item.title)} className="text-[10px] text-red-400 bg-red-950/20 hover:bg-red-900/40 px-2.5 py-1.5 rounded-lg border border-red-500/10 font-bold">삭제</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* [3구역] 선수 명단 관리 추가/삭제 */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md">
          <h2 className="text-base sm:text-lg font-bold mb-4">👥 구단 선수 명단 관리 ({players.length}명)</h2>
          <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4 flex-wrap sm:flex-nowrap">
            <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="선수 이름 입력" className="flex-1 min-w-[150px] bg-black/20 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
            <select value={newPlayerPosition} onChange={(e) => setNewPlayerPosition(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] cursor-pointer">
              <option value="스트라이커">스트라이커 (공격수)</option>
              <option value="미드필더">미드필더 (중원)</option>
              <option value="수비수">수비수 (디펜더)</option>
              <option value="골키퍼">골키퍼 (GK)</option>
            </select>
            <button type="submit" className="bg-[#d4af37] text-black font-black px-4 py-2.5 rounded-xl text-xs hover:bg-[#c4a030] whitespace-nowrap w-full sm:w-auto">➕ 선수 등록</button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {players.map((p) => (
              <div key={p.id} className="bg-black/20 border border-white/5 p-2.5 rounded-xl flex items-center justify-between gap-1">
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-100 truncate">{p.name}</p>
                  <p className="text-[9px] text-[#d4af37]/70 font-semibold">{p.position}</p>
                </div>
                <button type="button" onClick={() => handleDeletePlayer(p.id, p.name)} className="text-[10px] text-red-400 bg-red-950/20 hover:bg-red-900/40 px-1.5 py-1 rounded border border-red-500/10">제외</button>
              </div>
            ))}
          </div>
        </section>

        {/* [4구역] 문의 메세지 내역 */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-3">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">✉️ 접수된 문의/신청 리스트 ({filteredMessages.length}건)</h2>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-start sm:self-auto text-[11px] font-bold">
              <button type="button" onClick={() => setMessageFilter('all')} className={`px-3 py-1 rounded-lg transition-colors ${messageFilter === 'all' ? 'bg-[#d4af37] text-black' : 'text-gray-400 hover:text-white'}`}>전체보기</button>
              <button type="button" onClick={() => setMessageFilter('join')} className={`px-3 py-1 rounded-lg transition-colors ${messageFilter === 'join' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>입단지원</button>
              <button type="button" onClick={() => setMessageFilter('inquiry')} className={`px-3 py-1 rounded-lg transition-colors ${messageFilter === 'inquiry' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>일반문의</button>
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-10 bg-black/10 rounded-2xl border border-white/5">선택한 분류에 수신된 메시지가 없습니다.</p>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="bg-black/20 border border-white/5 p-4 rounded-xl text-xs space-y-2 relative group hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${msg.type === 'join' ? 'bg-amber-400 text-black' : 'bg-blue-500 text-white'}`}>
                          {msg.type === 'join' ? '입단 지원' : '일반 문의'}
                        </span>
                        <strong className="text-gray-200 text-sm">{msg.name}</strong>
                      </div>
                      <span className="text-[10px] text-gray-500 block font-mono">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteMessage(msg.id, msg.name)} className="text-[10px] text-red-400 bg-red-950/20 hover:bg-red-900/50 border border-red-500/20 px-2 py-1 rounded-lg font-bold shadow-sm transition-colors">문의 삭제</button>
                  </div>
                  <p className="text-gray-300 bg-black/20 p-3 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed break-all font-sans select-text">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
