'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase'; // 구단주님의 프로젝트 파일 경로에 맞춤

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
  is_practice: boolean; 
  match_result: string; // 💡 경기 결과 타입 반영
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 매치 수정용 State
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeLogo, setHomeLogo] = useState('');
  const [awayLogo, setAwayLogo] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [isPractice, setIsPractice] = useState(false); 
  const [matchResult, setMatchResult] = useState('무승부'); // 💡 경기 결과 라디오 전용 State

  // 신규 선수 등록용 State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('미드필더');

  // 자동 로그인 유지 체크
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

    if (!adminPassword) {
      alert('환경 변수(NEXT_PUBLIC_ADMIN_PASSWORD)를 빌드 과정에서 읽어오지 못했습니다. .env.local을 확인해 주세요.');
      return;
    }

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
      setIsLoading(true);
      
      const { data: pData } = await supabase.from('players').select('*').order('id', { ascending: true });
      if (pData) setPlayers(pData);

      const { data: mData } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (mData) setMessages(mData);

      const { data: matchData, error: matchError } = await supabase
        .schema('public')
        .from('matches')
        .select('*');

      if (matchError) {
        console.error("매치 조회 실패:", matchError.message);
        setMatches([]);
      } else if (matchData) {
        setMatches(matchData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatchId) return;

    try {
      const { error } = await supabase
        .schema('public')
        .from('matches')
        .update({
          home_score: Number(homeScore),
          away_score: Number(awayScore),
          home_logo: homeLogo.trim(),
          away_logo: awayLogo.trim(),
          home_team: homeTeam.trim(),
          away_team: awayTeam.trim(),
          is_practice: isPractice,
          match_result: matchResult // 💡 승리/패배/무승부 값 데이터베이스에 업데이트
        })
        .eq('id', editingMatchId);

      if (error) {
        alert("등록 실패 원인: " + error.message);
      } else {
        alert("경기 결과 및 승패 조건이 성공적으로 업데이트되었습니다! 🏆");
        setEditingMatchId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return alert('선수 이름을 입력해 주세요.');

    try {
      const { error } = await supabase
        .from('players')
        .insert([{ name: newPlayerName.trim(), position: newPlayerPosition }]);

      if (error) {
        alert('선수 등록 실패: ' + error.message);
      } else {
        alert(`${newPlayerName} 선수가 명단에 등록되었습니다! 🏃‍♂️`);
        setNewPlayerName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlayer = async (id: number, name: string) => {
    if (!confirm(`${name} 선수를 정말 명단에서 제외하시겠습니까?`)) return;

    try {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (error) {
        alert('삭제 실패: ' + error.message);
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
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
    setMatchResult(match.match_result || '무승부'); // 💡 기존 저장값 불러오기
  };

  if (isLoading && !isAuthenticated) {
    return (
      <div className="bg-[#1e060c] min-h-screen flex items-center justify-center text-white">
        <p className="text-sm text-gray-400 animate-pulse">구단주 세션 흔적 확인 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-[#1e060c] min-h-screen flex items-center justify-center text-white px-4">
        <form onSubmit={handleLogin} className="bg-[#36101b] p-8 rounded-2xl shadow-xl w-full max-w-sm border border-white/5">
          <h2 className="text-xl font-bold mb-6 text-center text-[#d4af37]">계비 UTD 관리자 로그인</h2>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="관리자 비밀번호 입력" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm mb-4 text-white text-center focus:outline-none focus:border-[#d4af37]" />
          <button type="submit" className="w-full bg-[#d4af37] text-black font-bold py-3 rounded-xl text-sm hover:bg-[#c4a030] transition-colors">입장하기</button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#1e060c] min-h-screen text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h1 className="text-2xl font-black text-[#d4af37]">🛡️ 구단 관리 센터</h1>
          <button onClick={handleLogout} className="text-xs bg-red-900/40 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-900/60 transition-colors">로그아웃</button>
        </div>

        {/* 경기 결과 관리 판넬 */}
        <section className="bg-[#36101b] p-6 rounded-2xl border border-white/5 shadow-md">
          <h2 className="text-lg font-bold mb-4">📊 경기 스코어 및 결과 설정</h2>
          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.id} className="border border-white/5 p-4 rounded-xl bg-black/10">
                {editingMatchId === m.id ? (
                  <form onSubmit={handleUpdateMatch} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">홈팀 명칭</label>
                        <input type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">원정팀 명칭</label>
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
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">🏠 홈팀 로고 URL</label>
                      <input type="text" value={homeLogo} onChange={(e) => setHomeLogo(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">🏃 원정팀 로고 URL</label>
                      <input type="text" value={awayLogo} onChange={(e) => setAwayLogo(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-xs text-white" />
                    </div>
                    
                    {/* 1. 연습 경기 스위치 */}
                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" id="isPractice" checked={isPractice} onChange={(e) => setIsPractice(e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                      <label htmlFor="isPractice" className="text-xs font-bold text-amber-400 cursor-pointer">🛠️ 이 경기를 '연습 경기'로 표시</label>
                    </div>

                    {/* 2. 경기 결과 단일 선택 라디오 버튼 (하나만 선택 가능) */}
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <label className="block text-[10px] text-gray-400 font-bold">🎯 경기 결과 지정 (단일 선택)</label>
                      <div className="flex gap-4 items-center pt-1">
                        <label className="flex items-center gap-1 text-xs text-green-400 font-bold cursor-pointer">
                          <input type="radio" name="resultGroup" value="승리" checked={matchResult === '승리'} onChange={(e) => setMatchResult(e.target.value)} className="accent-green-500" />
                          🟢 승리
                        </label>
                        <label className="flex items-center gap-1 text-xs text-red-400 font-bold cursor-pointer">
                          <input type="radio" name="resultGroup" value="패배" checked={matchResult === '패배'} onChange={(e) => setMatchResult(e.target.value)} className="accent-red-500" />
                          🔴 패배
                        </label>
                        <label className="flex items-center gap-1 text-xs text-gray-400 font-bold cursor-pointer">
                          <input type="radio" name="resultGroup" value="무승부" checked={matchResult === '무승부'} onChange={(e) => setMatchResult(e.target.value)} className="accent-gray-500" />
                          ⚪ 무승부
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold">💾 저장하기</button>
                      <button type="button" onClick={() => setEditingMatchId(null)} className="bg-gray-600 text-white px-4 py-2 rounded text-xs">취소</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="text-sm flex items-center gap-2 flex-wrap">
                      {m.is_practice && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold border border-amber-500/30">연습</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${m.match_result === '승리' ? 'bg-green-500 text-black' : m.match_result === '패배' ? 'bg-red-500 text-white' : 'bg-gray-600 text-white'}`}>{m.match_result || '무승부'}</span>
                      <span className="font-bold text-[#d4af37]">{m.home_team || '계비 UTD'}</span> <span>({m.home_score})</span> : <span>({m.away_score})</span> <span className="text-gray-300">{m.away_team || '잔뇨 FC'}</span>
                    </div>
                    <button onClick={() => startEdit(m)} className="bg-[#d4af37] text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#c4a030]">⚙️ 수정 및 등록</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 선수 명단 관리 */}
        <section className="bg-[#36101b] p-6 rounded-2xl border border-white/5 shadow-md space-y-6">
          <h2 className="text-lg font-bold">👥 선수 등록 및 명단 관리</h2>
          <form onSubmit={handleAddPlayer} className="bg-black/10 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-3">
            <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="선수 이름 기입" className="flex-1 bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
            <select value={newPlayerPosition} onChange={(e) => setNewPlayerPosition(e.target.value)} className="bg-[#1e060c] border border-white/10 rounded-xl p-2.5 text-xs text-gray-300">
              <option value="스트라이커">스트라이커 (FW)</option>
              <option value="미드필더">미드필더 (MF)</option>
              <option value="수비수">수비수 (DF)</option>
              <option value="골키퍼">골키퍼 (GK)</option>
            </select>
            <button type="submit" className="bg-[#d4af37] text-black font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-[#c4a030]">➕ 선수 추가</button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((player) => (
              <div key={player.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm mr-2">{player.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#d4af37]">{player.position}</span>
                </div>
                <button onClick={() => handleDeletePlayer(player.id, player.name)} className="text-[11px] text-red-400 font-medium px-2 py-1">방출 ❌</button>
              </div>
            ))}
          </div>
        </section>

        {/* 메시지 관리 */}
        <section className="bg-[#36101b] p-6 rounded-2xl border border-white/5 shadow-md">
          <h2 className="text-lg font-bold mb-4">✉️ 도착한 메시지 리스트 ({messages.length}건)</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">도착한 팀 문의나 신청서가 없습니다.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-200">{msg.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${msg.type === 'join' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {msg.type === 'join' ? '참가 신청' : '팀 문의'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}