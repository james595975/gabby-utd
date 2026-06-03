'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface Player { 
  id: number; 
  name: string; 
  position: string; 
  back_number?: number | null; // 🔢 등번호 컬럼 추가
  lineup_spot?: number | null; 
}

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
  const router = useRouter();
  const supabase = createClient();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 현재 활성화된 관리 영역 탭 상태
  const [activeTab, setActiveTab] = useState<'matches' | 'news' | 'players' | 'lineup' | 'messages'>('matches');

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
  const [matchDate, setMatchDate] = useState('');

  // 홈 팀 & 원정 팀 고정 상수 설정
  const DEFAULT_HOME_TEAM = '계비 UTD';
  const DEFAULT_HOME_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/home_icon/home_icon.jpg'; 
  const DEFAULT_AWAY_TEAM = '잔뇨 FC'; 
  const DEFAULT_AWAY_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_lcon.jpg'; 

  const [addHomeTeam, setAddHomeTeam] = useState(DEFAULT_HOME_TEAM);
  const [addAwayTeam, setAddAwayTeam] = useState(DEFAULT_AWAY_TEAM);
  const [addHomeScore, setAddHomeScore] = useState(0);
  const [addAwayScore, setAddAwayScore] = useState(0);
  const [addHomeLogo, setAddHomeLogo] = useState(DEFAULT_HOME_LOGO); 
  const [addAwayLogo, setAddAwayLogo] = useState(DEFAULT_AWAY_LOGO);
  const [addIsPractice, setAddIsPractice] = useState(false);
  const [addMatchResult, setAddMatchResult] = useState('승리'); 
  const [addMatchDate, setAddMatchDate] = useState('');

  // 선수 등록 및 수정 관련 상태 (등번호 추가 🔢)
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('미드필더');
  const [newPlayerBackNumber, setNewPlayerBackNumber] = useState<string>(''); // 등번호 상태
  const [newPlayerLineupSpot, setNewPlayerLineupSpot] = useState<string>('');
  const [formation, setFormation] = useState('4-4-2');

  // 개별 선수 등번호 수정을 위한 인라인 상태 저장 매퍼 (선택 사항)
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);

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
  const todayStr = new Date().toISOString().split('T')[0];
  setAddMatchDate(todayStr);

  const checkAdmin = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/admin/login');
        return;
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminUser) {
        await supabase.auth.signOut();
        router.replace('/admin/login');
        return;
      }

      setIsAuthenticated(true);
      await fetchData();
    } catch (error) {
      console.error('관리자 권한 확인 중 오류 발생:', error);
      router.replace('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  checkAdmin();
}, [router, supabase]);

const handleLogout = async () => {
  await supabase.auth.signOut();
  setIsAuthenticated(false);
  router.replace('/admin/login');
};

  const fetchData = async () => {
    try {
      setIsLoading(false);
      
      // 🔢 선수단 로드 시 등번호(back_number) 오름차순 정렬, 번호가 없으면 뒤로 배치
      const { data: pData } = await supabase
        .from('players')
        .select('*')
        .order('back_number', { ascending: true, nullsFirst: false });
      if (pData) setPlayers(pData);

      const { data: mData } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (mData) setMessages(mData);

      const { data: fData } = await supabase.from('formations').select('current_formation').eq('id', 1).single();
      if (fData) setFormation(fData.current_formation);

      const { data: matchData, error: matchError } = await supabase.from('matches').select('*').order('id', { ascending: false });
      if (matchData && !matchError) setMatches(matchData);

      const { data: newsData, error: newsError } = await supabase.from('news').select('*').order('id', { ascending: false });
      if (newsData && !newsError) setNews(newsData);
    } catch (e) {
      console.error(e);
    }
  };

  // 포메이션 스폿 매핑 핸들러
  const handleAssignSpot = async (playerId: number, spotNumber: number | null) => {
    try {
      // 1단계: 대기 명단으로 빼는 게 아니라 특정 스폿(1~11)에 선수를 배치하는 경우
      if (spotNumber !== null) {
        // 원래 그 전술 자리에 있던 선수의 lineup_spot을 null(대기 명단)로 먼저 비워줍니다.
        await supabase
          .from('players')
          .update({ lineup_spot: null })
          .eq('lineup_spot', spotNumber);
      }

      // 2단계: 선택한 선수를 원하는 전술 자리에 최종적으로 업데이트합니다.
      const { error } = await supabase
        .from('players')
        .update({ lineup_spot: spotNumber })
        .eq('id', playerId);

      if (error) {
        alert('라인업 지정 실패: ' + error.message);
      } else {
        fetchData(); // UI 실시간 갱신
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleUpdateFormation = async (selectedFormation: string) => {
  try {
    const { error } = await supabase
      .from('formations')
      .update({ current_formation: selectedFormation, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      alert('포메이션 변경 실패: ' + error.message);
    } else {
      setFormation(selectedFormation);
      alert(`포메이션이 ${selectedFormation}으로 변경되었습니다! ⚽`);
    }
  } catch (err) {
    console.error(err);
  }
};

  // 🔢 등번호 인라인 수정용 핸들러 추가
  const handleUpdateBackNumber = async (playerId: number, backNumber: number | null) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ back_number: backNumber })
        .eq('id', playerId);

      if (error) {
        alert('등번호 수정 실패: ' + error.message);
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
            home_logo: addHomeLogo.trim() || null, 
            away_logo: addAwayLogo.trim() || null,
            is_practice: addIsPractice,
            match_result: addMatchResult,
            date: addMatchDate || new Date().toISOString().split('T')[0]
          }
        ]);

      if (error) {
        alert("경기 등록 실패: " + error.message);
      } else {
        alert("경기 결과가 성공적으로 등록되었습니다! ⚽");
        setAddHomeTeam(DEFAULT_HOME_TEAM);
        setAddHomeLogo(DEFAULT_HOME_LOGO); 
        setAddAwayTeam(DEFAULT_AWAY_TEAM); 
        setAddAwayLogo(DEFAULT_AWAY_LOGO); 
        setAddHomeScore(0);
        setAddAwayScore(0);
        setAddIsPractice(false);
        setAddMatchResult('승리');
        setAddMatchDate(new Date().toISOString().split('T')[0]); 
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
          home_logo: homeLogo.trim() || null, 
          away_logo: awayLogo.trim() || null,
          is_practice: isPractice,
          match_result: matchResult,
          date: matchDate
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

  const handleDeleteMatch = async (id: number, home: string, away: string) => {
    if (!confirm(`[${home} vs ${away}] 경기를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (!error) fetchData();
  };

  // 👤 선수 등록 프로세스 (등번호 매핑 포함)
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return alert('선수 이름을 입력해 주세요.');
    
    const { error } = await supabase
      .from('players')
      .insert([{ 
        name: newPlayerName.trim(), 
        position: newPlayerPosition,
        back_number: newPlayerBackNumber ? Number(newPlayerBackNumber) : null, // 등번호 추가
        lineup_spot: newPlayerLineupSpot ? Number(newPlayerLineupSpot) : null 
      }]);

    if (!error) {
      setNewPlayerName('');
      setNewPlayerBackNumber('');
      setNewPlayerLineupSpot('');
      fetchData();
    } else {
      alert('선수 등록 실패: ' + error.message);
    }
  };

  const handleDeletePlayer = async (id: number, name: string) => {
    if (!confirm(`${name} 선수를 구단 명단에서 제외하시겠습니까?`)) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (!error) fetchData();
  };

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
    setHomeLogo(match.home_logo && match.home_logo !== "🛡️" ? match.home_logo : ''); 
    setAwayLogo(match.away_logo && match.away_logo !== "🛡️" ? match.away_logo : '');
    setHomeTeam(match.home_team || '계비 UTD');
    setAwayTeam(match.away_team || '');
    setIsPractice(match.is_practice || false);
    setMatchResult(match.match_result || '무승부');
    setMatchDate(match.date || '');
  };

  const filteredMessages = messages.filter((msg) => {
    if (messageFilter === 'all') return true;
    return msg.type === messageFilter;
  });
  if (isLoading || !isAuthenticated) {
  return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center text-white px-4 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#1a233a]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#3b1028]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <p className="text-sm text-gray-400 relative z-10">관리자 권한 확인 중...</p>
    </div>
  );
}

  return (
    <div className="bg-[#050505] min-h-screen text-white p-4 sm:p-6 pb-24 relative overflow-hidden font-sans antialiased">
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#1a233a]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#3b1028]/20 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* 상단 헤더 로우 */}
        <div className="flex justify-between items-center border-b border-gray-800/60 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-[#f2d272] tracking-wide flex items-center gap-2">
            🛡️ 구단 매니저 센터
          </h1>
          <button onClick={handleLogout} className="text-xs bg-red-950/40 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold hover:bg-red-900/40 transition-colors">
            로그아웃
          </button>
        </div>
        <div className="bg-gradient-to-r from-[#070b08] via-[#0a0a0a] to-[#111] border border-green-900/40 p-5 sm:p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
        {/* 배경에 은은한 녹색 불빛 효과 (선택사항) */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/20 transition-all duration-500" />
        
        <div className="space-y-1 z-10">
          <span className="text-[10px] text-green-400 font-mono font-bold flex items-center gap-1.5 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Tactics Manager
          </span>
          <h3 className="text-base font-black text-white flex items-center gap-1.5">
            ⚽ 실시간 선발 라인업 및 포메이션 제어 센터
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            선수들의 경기장 스폿 배치를 실시간으로 수정하고 중복 배정을 방지합니다. 저장 시 메인 홈 화면의 잔디구장에 즉시 반영됩니다.
          </p>
        </div>
        
        <Link
          href="./admin/lineup" // 💡 만약 app/lineup/page.tsx 경로라면 '/lineup'으로 변경해주세요!
          className="bg-green-600 hover:bg-green-500 text-white font-black text-xs px-5 py-3.5 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all text-center sm:min-w-[160px] flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98] z-10"
        >
          전술 관리판 열기 ➔
        </Link>
      </div>

        {/* 🗂️ 메뉴 제어 탭바 */}
        <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-xl border border-gray-900 overflow-x-auto text-xs font-bold scrollbar-hide">
          <button type="button" onClick={() => setActiveTab('matches')} className={`px-3.5 py-2 rounded-lg transition-all flex-shrink-0 ${activeTab === 'matches' ? 'bg-[#f2d272] text-black font-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            📊 경기결과 관리
          </button>
          <button type="button" onClick={() => setActiveTab('news')} className={`px-3.5 py-2 rounded-lg transition-all flex-shrink-0 ${activeTab === 'news' ? 'bg-[#f2d272] text-black font-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            📰 구단소식 포스팅
          </button>
          <button type="button" onClick={() => setActiveTab('players')} className={`px-3.5 py-2 rounded-lg transition-all flex-shrink-0 ${activeTab === 'players' ? 'bg-[#f2d272] text-black font-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            👥 선수단/등번호 관리
          </button>
          <button type="button" onClick={() => setActiveTab('messages')} className={`px-3.5 py-2 rounded-lg transition-all flex-shrink-0 ${activeTab === 'messages' ? 'bg-[#f2d272] text-black font-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            ✉️ 접수된 문의
          </button>
        </div>

        {/* [1구역] 경기 스코어 관리 */}
        {activeTab === 'matches' && (
          <section className="bg-[#0a0a0a] p-5 sm:p-6 rounded-2xl border border-gray-800/60 shadow-xl space-y-5 backdrop-blur-sm">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-gray-200">
              📊 경기 매치 결과 관리 <span className="text-xs text-gray-500 font-mono font-normal">({matches.length}건)</span>
            </h2>
            <form onSubmit={handleAddMatch} className="bg-black/30 p-4 rounded-xl border border-dashed border-gray-800 space-y-3">
              <h3 className="text-xs font-black text-[#f2d272] flex items-center gap-1">➕ 새로운 경기 결과 추가 등록</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">홈 팀 명 *</label>
                  <input type="text" value={addHomeTeam} onChange={(e) => setAddHomeTeam(e.target.value)} className="w-full bg-black/50 border border-gray-800 p-2.5 rounded-xl text-xs text-white focus:border-[#f2d272] focus:outline-none font-bold transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">원정 팀 명 *</label>
                  <input type="text" value={addAwayTeam} onChange={(e) => setAddAwayTeam(e.target.value)} className="w-full bg-black/50 border border-gray-800 p-2.5 rounded-xl text-xs text-white focus:border-[#f2d272] focus:outline-none font-bold transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">홈 스코어</label>
                  <input type="number" value={addHomeScore} onChange={(e) => setAddHomeScore(Number(e.target.value))} className="w-full bg-black/50 border border-gray-800 p-2.5 rounded-xl text-xs text-white focus:border-[#f2d272] focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">원정 스코어</label>
                  <input type="number" value={addAwayScore} onChange={(e) => setAddAwayScore(Number(e.target.value))} className="w-full bg-black/50 border border-gray-800 p-2.5 rounded-xl text-xs text-white focus:border-[#f2d272] focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">홈 로고 주소</label>
                  <input type="text" value={addHomeLogo} onChange={(e) => setAddHomeLogo(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-black/50 border border-gray-800 p-2.5 rounded-xl text-xs text-gray-300 focus:border-[#f2d272] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">원정 팀 로고 주소</label>
                  <input type="text" value={addAwayLogo} onChange={(e) => setAddAwayLogo(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-black/50 border border-gray-800 p-2.5 rounded-xl text-xs text-gray-300 focus:border-[#f2d272] focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">🗓️ 경기 진행 날짜</label>
                  <input type="date" value={addMatchDate} onChange={(e) => setAddMatchDate(e.target.value)} className="w-full sm:w-fit bg-black/50 border border-gray-800 p-2 rounded-xl text-xs text-white focus:border-[#f2d272] focus:outline-none font-mono font-bold" />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 flex-wrap sm:flex-nowrap justify-between border-t border-gray-900/60">
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" id="addIsPractice" checked={addIsPractice} onChange={(e) => setAddIsPractice(e.target.checked)} className="w-4 h-4 accent-[#f2d272] cursor-pointer" />
                  <label htmlFor="addIsPractice" className="text-xs font-bold text-gray-400 cursor-pointer select-none">🛠️ 연습 매치(친선전)로 표시</label>
                </div>

                <div className="flex gap-4 items-center">
                  <span className="text-[10px] text-gray-500 font-bold">🎯 최종 결과:</span>
                  {['승리', '패배', '무승부'].map((res) => (
                    <label key={res} className="flex items-center gap-1 text-xs font-bold cursor-pointer select-none">
                      <input type="radio" name="addResultGroup" value={res} checked={addMatchResult === res} onChange={(e) => setAddMatchResult(e.target.value)} className="accent-[#f2d272]" />
                      {res === '승리' ? '🟢 승' : res === '패배' ? '🔴 패' : '⚪ 무'}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-2.5 rounded-xl text-xs shadow-md transition-colors mt-2">
                ✨ 신규 경기 데이터베이스에 저장하기
              </button>
            </form>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 border-t border-gray-900 pt-3">
              {matches.map((m) => (
                <div key={m.id} className="border border-gray-900 p-4 rounded-xl bg-black/40 shadow-inner">
                  {editingMatchId === m.id ? (
                    <form onSubmit={handleUpdateMatch} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">홈 팀 명</label>
                          <input type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full bg-black/50 border border-gray-800 p-2 rounded text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">원정 팀 명</label>
                          <input type="text" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="w-full bg-black/50 border border-gray-800 p-2 rounded text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">홈 스코어</label>
                          <input type="number" value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} className="w-full bg-black/50 border border-gray-800 p-2 rounded text-xs text-white font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 mb-1">원정 스코어</label>
                          <input type="number" value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} className="w-full bg-black/50 border border-gray-800 p-2 rounded text-xs text-white font-mono" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button type="submit" className="bg-[#f2d272] hover:bg-[#e0be5a] px-4 py-2 rounded-xl text-xs text-black font-black shadow">💾 수정 완료</button>
                        <button type="button" onClick={() => setEditingMatchId(null)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors">취소</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="text-xs sm:text-sm flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${m.match_result === '승리' ? 'bg-green-500/10 text-green-400 border-green-500/20' : m.match_result === '패배' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-700/20 text-gray-300 border-gray-600/30'}`}>{m.match_result || '무승부'}</span>
                        <span className="text-[10px] text-gray-500 font-mono font-bold">{m.date}</span>
                        <span className="font-black text-gray-200">{m.home_team || '계비 UTD'}</span> 
                        <span className="font-mono bg-black/50 border border-gray-800 px-2 py-0.5 rounded font-bold text-white text-xs">{m.home_score} : {m.away_score}</span> 
                        <span className="text-gray-400 font-medium">{m.away_team}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => startEdit(m)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">수정</button>
                        <button onClick={() => handleDeleteMatch(m.id, m.home_team || '홈', m.away_team || '원정')} className="bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">삭제</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* [2구역] 구단 소식 게시판 포스팅 및 수정 관리 */}
        {activeTab === 'news' && (
          <section className="bg-[#0a0a0a] p-5 sm:p-6 rounded-2xl border border-gray-800/60 shadow-xl space-y-5 backdrop-blur-sm">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-gray-200">
              {editingNewsId ? '📝 선택한 구단 소식 수정 중' : '📰 구단 소식 포스팅 관리'} <span className="text-xs text-gray-500 font-mono font-normal">({news.length}건)</span>
            </h2>
            <form onSubmit={handleSaveNews} className={`space-y-3 p-4 rounded-xl border ${editingNewsId ? 'bg-amber-500/5 border-amber-500/20' : 'bg-black/30 border-gray-800'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-gray-400 mb-1">소식 제목 *</label>
                  <input type="text" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#f2d272]" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">분류 태그</label>
                  <select value={newsTag} onChange={(e) => setNewsTag(e.target.value)} className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-white cursor-pointer focus:border-[#f2d272]">
                    <option value="공지">🚨 공지사항</option>
                    <option value="경기결과">⚽ 경기결과</option>
                    <option value="이벤트">🎉 이벤트/행사</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">🖼️ 대표 이미지 링크 주소 (선택)</label>
                  <input type="text" value={newsImageUrl} onChange={(e) => setNewsImageUrl(e.target.value)} placeholder="https://.../image.jpg" className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#f2d272]" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">🔗 외부 이동 링크 주소 (선택)</label>
                  <input type="text" value={newsLinkUrl} onChange={(e) => setNewsLinkUrl(e.target.value)} placeholder="https://instagram.com/..." className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#f2d272]" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">본문 내용 *</label>
                <textarea rows={4} value={newsContent} onChange={(e) => setNewsContent(e.target.value)} placeholder="공유할 상세 내용을 적어주세요." className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#f2d272] resize-none"></textarea>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-[#f2d272] text-black font-black py-2.5 rounded-xl text-xs hover:bg-[#e0be5a] shadow">
                  {editingNewsId ? '💾 수정 사항 저장하기' : '🚀 새로운 소식 발행하기'}
                </button>
                {editingNewsId && (
                  <button type="button" onClick={cancelNewsEdit} className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 rounded-xl text-xs">
                    취소
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 border-t border-gray-900 pt-3">
              <h3 className="text-xs font-black text-gray-400 mb-1">📋 현재 배포된 게시글 관리 리스트</h3>
              {news.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-4">등록된 구단 소식이 아직 없습니다.</p>
              ) : (
                news.map((item) => (
                  <div key={item.id} className="border border-gray-900 p-3.5 rounded-xl bg-black/40 flex justify-between items-center gap-4">
                    <div className="truncate flex items-center gap-3">
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt="thumbnail" className="w-10 h-10 rounded-lg object-cover bg-gray-950 flex-shrink-0 border border-gray-800" />
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-gray-800 text-gray-300 border border-gray-700">{item.tag}</span>
                          <h4 className="text-xs font-black text-gray-200 truncate">{item.title}</h4>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{item.content}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => startEditNews(item)} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        수정
                      </button>
                      <button type="button" onClick={() => handleDeleteNews(item.id, item.title)} className="bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/10 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* [3구역] 선수 명단 및 등번호 관리 🔢 */}
        {activeTab === 'players' && (
          <section className="bg-[#0a0a0a] p-5 sm:p-6 rounded-2xl border border-gray-800/60 shadow-xl backdrop-blur-sm">
            <h2 className="text-base sm:text-lg font-black mb-4 text-gray-200">👥 구단 선수 및 등번호 관리 <span className="text-xs text-gray-500 font-mono font-normal">({players.length}명 - 등번호순 정렬)</span></h2>
            
            <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-4 bg-black/30 p-3 rounded-xl border border-gray-900 items-end">
              <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold mb-1">선수 이름 *</label>
                  <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="이름" className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#f2d272] font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#f2d272] font-bold mb-1">🔢 등번호 지정</label>
                  <input type="number" value={newPlayerBackNumber} onChange={(e) => setNewPlayerBackNumber(e.target.value)} placeholder="예: 10" min="0" max="99" className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#f2d272] font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-bold mb-1">포지션 역할</label>
                <select value={newPlayerPosition} onChange={(e) => setNewPlayerPosition(e.target.value)} className="w-full bg-black/50 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#f2d272] cursor-pointer font-bold">
                  <option value="스트라이커">스트라이커 (공격수)</option>
                  <option value="미드필더">미드필더 (중원)</option>
                  <option value="수비수">수비수 (디펜더)</option>
                  <option value="골키퍼">골키퍼 (GK)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-green-400 font-bold mb-1">초기 전술 스팟</label>
                <select value={newPlayerLineupSpot} onChange={(e) => setNewPlayerLineupSpot(e.target.value)} className="w-full bg-black/50 border border-green-900/50 focus:border-green-500 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none cursor-pointer font-bold">
                  <option value="">대기 명단 (제외)</option>
                  <option value="1">Spot #1 (GK)</option>
                  <option value="2">Spot #2 (LB)</option>
                  <option value="3">Spot #3 (LCB)</option>
                  <option value="4">Spot #4 (RCB)</option>
                  <option value="5">Spot #5 (RB)</option>
                  <option value="6">Spot #6 (LCM)</option>
                  <option value="7">Spot #7 (CM)</option>
                  <option value="8">Spot #8 (RCM)</option>
                  <option value="9">Spot #9 (LW)</option>
                  <option value="10">Spot #10 (ST)</option>
                  <option value="11">Spot #11 (RW)</option>
                </select>
              </div>
              <button type="submit" className="bg-[#f2d272] text-black font-black h-[38px] rounded-xl text-xs hover:bg-[#e0be5a] shadow transition-all whitespace-nowrap w-full">
                ➕ 선수 등록
              </button>
            </form>

            {/* 선수 리스트에서 인라인으로 등번호 상시 변경 가능 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[450px] overflow-y-auto pr-1">
              {players.map((p) => (
                <div key={p.id} className="bg-black/40 border border-gray-900 p-3 rounded-xl flex items-center justify-between gap-2 shadow-inner group hover:border-gray-700 transition-colors">
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#f2d272] bg-white/5 px-1.5 py-0.5 rounded min-w-[22px] text-center">
                        {p.back_number !== null && p.back_number !== undefined ? p.back_number : '-'}
                      </span>
                      <p className="text-xs font-black text-gray-200 truncate">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] text-gray-400 font-bold">{p.position}</span>
                      <span className={`text-[8px] px-1 rounded font-mono font-extrabold ${p.lineup_spot ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-500'}`}>
                        {p.lineup_spot ? `Spot #${p.lineup_spot}` : '대기명단'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {editingPlayerId === p.id ? (
                      <input 
                        type="number" 
                        defaultValue={p.back_number !== null && p.back_number !== undefined ? p.back_number : ''} 
                        onBlur={(e) => {
                          const val = e.target.value;
                          handleUpdateBackNumber(p.id, val === '' ? null : Number(val));
                          setEditingPlayerId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            handleUpdateBackNumber(p.id, val === '' ? null : Number(val));
                            setEditingPlayerId(null);
                          }
                        }}
                        autoFocus
                        placeholder="번"
                        className="w-12 bg-black border border-[#f2d272] text-white p-1 text-center rounded text-xs font-mono font-bold focus:outline-none"
                      />
                    ) : (
                      <button type="button" onClick={() => setEditingPlayerId(p.id)} className="text-[10px] text-gray-400 bg-gray-900 hover:bg-gray-800 border border-gray-800 px-2 py-1 rounded font-bold transition-all">
                        번호수정
                      </button>
                    )}
                    <button type="button" onClick={() => handleDeletePlayer(p.id, p.name)} className="text-[10px] text-red-400 bg-red-950/20 hover:bg-red-900/40 px-2 py-1 rounded border border-red-500/10 font-bold transition-colors">제외</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* [4구역] 문의 메세지 내역 */}
        {activeTab === 'messages' && (
          <section className="bg-[#0a0a0a] p-5 sm:p-6 rounded-2xl border border-gray-800/60 shadow-xl space-y-4 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-900 pb-3">
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-gray-200">✉️ 접수된 문의/신청 리스트 <span className="text-xs text-gray-500 font-mono font-normal">({filteredMessages.length}건)</span></h2>
              <div className="flex bg-black/50 p-1 rounded-xl border border-gray-800 text-[11px] font-bold">
                <button type="button" onClick={() => setMessageFilter('all')} className={`px-3 py-1 rounded-lg transition-all ${messageFilter === 'all' ? 'bg-[#f2d272] text-black font-black' : 'text-gray-400'}`}>전체보기</button>
                <button type="button" onClick={() => setMessageFilter('join')} className={`px-3 py-1 rounded-lg transition-all ${messageFilter === 'join' ? 'bg-amber-500 text-black font-black' : 'text-gray-400'}`}>입단지원</button>
                <button type="button" onClick={() => setMessageFilter('inquiry')} className={`px-3 py-1 rounded-lg transition-all ${messageFilter === 'inquiry' ? 'bg-blue-600 text-white font-black' : 'text-gray-400'}`}>일반문의</button>
              </div>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="bg-black/30 border border-gray-900 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black ${msg.type === 'join' ? 'bg-amber-400 text-black' : 'bg-blue-600 text-white'}`}>{msg.type === 'join' ? '입단 지원' : '일반 문의'}</span>
                        <strong className="text-gray-200 text-sm font-black">{msg.name}</strong>
                      </div>
                      <span className="text-[10px] text-gray-500 block font-mono font-bold">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteMessage(msg.id, msg.name)} className="text-[10px] text-red-400 bg-red-950/20 hover:bg-red-900/50 border border-red-500/20 px-2.5 py-1 rounded-lg font-bold">문의 삭제</button>
                  </div>
                  <p className="text-gray-300 bg-black/40 p-3 rounded-xl border border-gray-900/60 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
