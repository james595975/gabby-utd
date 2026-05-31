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
  link_url?: string; // 🔥 이동 링크 인터페이스 추가
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
  const [homeLogo, setHomeLogo] = useState('');
  const [awayLogo, setAwayLogo] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [isPractice, setIsPractice] = useState(false); 
  const [matchResult, setMatchResult] = useState('무승부'); 

  // 신규 선수 등록 관련 상태
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('미드필더');

  // 신규 소식 등록 관련 상태
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsTag, setNewsTag] = useState('공지');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsLinkUrl, setNewsLinkUrl] = useState(''); // 🔥 이동 링크 상태 추가

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
      
      // 1. 선수 명단 가져오기
      const { data: pData } = await supabase.from('players').select('*').order('id', { ascending: true });
      if (pData) setPlayers(pData);

      // 2. 관리자 메시지 가져오기
      const { data: mData } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (mData) setMessages(mData);

      // 3. 경기 정보 가져오기
      const { data: matchData, error: matchError } = await supabase.from('matches').select('*');
      if (matchData && !matchError) setMatches(matchData);

      // 4. 구단 소식 가져오기
      const { data: newsData, error: newsError } = await supabase.from('news').select('*').order('id', { ascending: false });
      if (newsData && !newsError) setNews(newsData);

    } catch (e) {
      console.error(e);
    }
  };

  // 경기 결과 업데이트
  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatchId) return;

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: Number(homeScore),
          away_score: Number(awayScore),
          home_logo: homeLogo.trim(),
          away_logo: awayLogo.trim(),
          home_team: homeTeam.trim(),
          away_team: awayTeam.trim(),
          is_practice: isPractice,
          match_result: matchResult
        })
        .eq('id', editingMatchId);

      if (error) {
        alert("등록 실패: " + error.message);
      } else {
        alert("경기 결과가 성공적으로 업데이트되었습니다! ⚽");
        setEditingMatchId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
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

  // 소식 추가 기능 (link_url 바인딩 처리 완료)
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      return alert('제목과 내용은 필수 항목입니다.');
    }

    const { error } = await supabase
      .from('news')
      .insert([
        {
          title: newsTitle.trim(),
          content: newsContent.trim(),
          tag: newsTag,
          image_url: newsImageUrl.trim() || null,
          link_url: newsLinkUrl.trim() || null // 🔥 대시보드 링크 컬럼 저장
        }
      ]);

    if (!error) {
      alert('새로운 소식이 성공적으로 등록되었습니다! 📰');
      setNewsTitle('');
      setNewsContent('');
      setNewsImageUrl('');
      setNewsLinkUrl(''); // 리셋
      setNewsTag('공지');
      fetchData();
    } else {
      alert('소식 등록 실패: ' + error.message);
    }
  };

  // 소식 삭제 기능
  const handleDeleteNews = async (id: number, title: string) => {
    if (!confirm(`"${title}" 소식을 삭제하시겠습니까? 홈 화면과 소식 페이지에서 모두 내려갑니다.`)) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) fetchData();
  };

  const startEdit = (match: MatchData) => {
    setEditingMatchId(match.id);
    setHomeScore(match.home_score);
    setAwayScore(match.away_score);
    setHomeLogo(match.home_logo || '');
    setAwayLogo(match.away_logo || '');
    setHomeTeam(match.home_team || '계비 UTD');
    setAwayTeam(match.away_team || '잔뇨 FC');
    setIsPractice(match.is_practice || false);
    setMatchResult(match.match_result || '무승부');
  };

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

        {/* [1구역] 경기 스코어 및 상태 관리 */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md">
          <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">📊 경기 결과 설정</h2>
          <div className="space-y-4">
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
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" id="isPractice" checked={isPractice} onChange={(e) => setIsPractice(e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                      <label htmlFor="isPractice" className="text-xs font-bold text-amber-400 cursor-pointer">🛠️ 연습 경기 매치로 표시</label>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <label className="block text-[10px] text-gray-400 font-bold">🎯 최종 매치 결과 매칭</label>
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
                      <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-xs font-black">💾 저장</button>
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
                      <span className="font-bold text-[#d4af37]">{m.home_team || '계비 UTD'}</span> 
                      <span className="font-mono bg-black/40 px-2 py-0.5 rounded font-bold text-white">{m.home_score} : {m.away_score}</span> 
                      <span className="text-gray-300">{m.away_team || '잔뇨 FC'}</span>
                    </div>
                    <button onClick={() => startEdit(m)} className="bg-[#d4af37] text-black hover:bg-[#c4a030] px-3 py-1.5 rounded text-xs font-black transition-colors">수정하기</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* [2구역] 구단 소식 게시판 포스팅 관리 (이동 링크 입력 폼 통합) */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md space-y-4">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">📰 구단 소식 포스팅 관리 ({news.length}건)</h2>
          
          {/* 소식 글쓰기 폼 */}
          <form onSubmit={handleAddNews} className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
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
              {/* 🔥 새롭게 연동한 클릭 시 연결 링크 입력 칸 */}
              <div>
                <label className="block text-[10px] text-amber-400 font-bold mb-1">🔗 클릭 시 이동할 상세 링크 주소 (선택)</label>
                <input type="text" value={newsLinkUrl} onChange={(e) => setNewsLinkUrl(e.target.value)} placeholder="https://instagram.com/... (인스타 링크 등)" className="w-full bg-black/40 border border-amber-500/20 focus:border-[#d4af37] rounded-xl p-2.5 text-xs text-white focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 mb-1">본문 내용 *</label>
              <textarea rows={3} value={newsContent} onChange={(e) => setNewsContent(e.target.value)} placeholder="구단원들에게 공유할 상세 내용을 적어주세요." className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-2.5 rounded-xl text-xs transition-colors">
              🚀 작성한 소식 발행하기
            </button>
          </form>

          {/* 발행된 소식 리스트 내역 */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {news.map((item) => (
              <div key={item.id} className="bg-black/10 border border-white/5 p-3 rounded-xl flex justify-between items-center gap-4 text-xs">
                <div className="truncate space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-black/40 text-gray-400 px-1.5 py-0.5 rounded font-mono">ID: {item.id}</span>
                    <span className="text-[10px] text-amber-300 font-bold">[{item.tag}]</span>
                    {item.link_url && <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded border border-amber-500/20">🔗 링크 연동됨</span>}
                    <span className="text-gray-400 text-[10px]">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-bold text-gray-200 truncate">{item.title}</p>
                </div>
                <button type="button" onClick={() => handleDeleteNews(item.id, item.title)} className="text-[10px] text-red-400 bg-red-950/20 hover:bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-500/10 font-bold flex-shrink-0">
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* [3구역] 선수 명단 관리 추가/삭제 */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md">
          <h2 className="text-base sm:text-lg font-bold mb-4">👥 구단 선수 명단 관리 ({players.length}명)</h2>
          
          {/* 선수 등록 폼 */}
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

          {/* 등록된 선수 리스트 리포트 */}
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

        {/* [4구역] 접수된 문의 메세지 내역 */}
        <section className="bg-[#36101b] p-5 sm:p-6 rounded-2xl border border-white/5 shadow-md">
          <h2 className="text-base sm:text-lg font-bold mb-4">✉️ 접수된 문의/신청 리스트 ({messages.length}건)</h2>
          {messages.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">수신된 메시지가 없습니다.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-black/20 border border-white/5 p-3.5 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${msg.type === 'join' ? 'bg-amber-400 text-black' : 'bg-blue-500 text-white'}`}>
                        {msg.type === 'join' ? '입단 지원' : '일반 문의'}
                      </span>
                      <strong className="text-gray-200 text-sm">{msg.name}</strong>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-gray-300 bg-black/10 p-2.5 rounded border border-white/5 whitespace-pre-wrap leading-relaxed break-all">
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
