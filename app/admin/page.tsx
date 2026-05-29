'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface Player { id: number; name: string; position: string; }
interface Message { id: number; type: string; name: string; content: string; created_at?: string; }
interface MatchData { id: number; home_team?: string; away_team?: string; home_score: number; away_score: number; home_logo?: string; away_logo?: string; date?: string; recent_form?: string; }

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 [추가] 메시지 구별을 위한 필터 상태 관리 ('all': 전체, 'inquiry': 팀 문의, 'join': 참가 신청)
  const [messageFilter, setMessageFilter] = useState<'all' | 'inquiry' | 'join'>('all');

  // 매치 수정용 State
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeLogo, setHomeLogo] = useState('');
  const [awayLogo, setAwayLogo] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');

  // 신규 선수 등록용 State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('미드필더');

  // [자동 로그인] 로컬스토리지 흔적 검사
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
      alert('환경 변수(NEXT_PUBLIC_ADMIN_PASSWORD)를 읽어오지 못했습니다.');
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
      
      // 1. 선수 명단 로드
      const { data: pData } = await supabase.from('players').select('*').order('id', { ascending: true });
      if (pData) setPlayers(pData);

      // 2. 메시지 리스트 로드
      const { data: mData } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (mData) setMessages(mData);

      // 3. 매치 데이터 로드
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

  // 매치 수정 저장
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
          away_team: awayTeam.trim()
        })
        .eq('id', editingMatchId);

      if (error) {
        alert("등록 실패 원인: " + error.message);
      } else {
        alert("경기 결과가 업데이트되었습니다! 🏆");
        setEditingMatchId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 신규 선수 등록
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
        alert(`${newPlayerName} 선수가 등록되었습니다! 🏃‍♂️`);
        setNewPlayerName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 선수 삭제
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

  // 문의 내역 삭제 함수
  const handleDeleteMessage = async (id: number, name: string) => {
    if (!confirm(`${name}님의 문의 내역을 정말 삭제하시겠습니까?\n(삭제하면 복구할 수 없습니다.)`)) return;

    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) {
        alert('문의 내역 삭제 실패: ' + error.message);
      } else {
        alert('문의 내역이 깔끔하게 삭제되었습니다.');
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
  };

  // 💡 [추가 로직] 선택한 탭 필터에 맞춰 화면에 보여줄 메시지만 걸러내기
  const filteredMessages = messages.filter((msg) => {
    if (messageFilter === 'all') return true;
    return msg.type === messageFilter;
  });

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
          <h1 className="text-2xl font-black text-[#d4af37]">🛡️ 계비 UTD 구단 관리 센터</h1>
          <button onClick={handleLogout} className="text-xs bg-red-900/40 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-900/60 transition-colors">로그아웃</button>
        </div>

        {/* 1. 경기 결과 관리 */}
        <section className="bg-[#36101b] p-6 rounded-2xl border border-white/5 shadow-md">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">📊 경기 스코어 및 구단 로고 관리</h2>
          {matches.length === 0 ? (
            <p className="text-xs text-gray-400">조회할 매치 목록이 없습니다.</p>
          ) : (
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
                      <div className="flex gap-2 pt-2">
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-xs font-bold">💾 저장하기</button>
                        <button type="button" onClick={() => setEditingMatchId(null)} className="bg-gray-600 text-white px-4 py-2 rounded text-xs">취소</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-bold text-[#d4af37]">{m.home_team || '계비 UTD'}</span> <span className="font-black">({m.home_score})</span> : <span className="font-black">({m.away_score})</span> <span className="text-gray-300">{m.away_team || '잔뇨 FC'}</span>
                      </div>
                      <button onClick={() => startEdit(m)} className="bg-[#d4af37] text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#c4a030]">⚙️ 수정 및 등록</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. 선수 명단 관리 */}
        <section className="bg-[#36101b] p-6 rounded-2xl border border-white/5 shadow-md space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">👥 선수 등록 및 명단 관리</h2>
          <form onSubmit={handleAddPlayer} className="bg-black/10 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-3">
            <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="선수 이름 기입" className="flex-1 bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]" />
            <select value={newPlayerPosition} onChange={(e) => setNewPlayerPosition(e.target.value)} className="bg-[#1e060c] border border-white/10 rounded-xl p-2.5 text-xs text-gray-300 focus:outline-none">
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
                <button onClick={() => handleDeletePlayer(player.id, player.name)} className="text-[11px] text-red-400 hover:text-red-500 font-medium px-2 py-1">방출 ❌</button>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 문의/신청 메시지 확인 및 구별 분류 섹션 */}
        <section className="bg-[#36101b] p-6 rounded-2xl border border-white/5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold">✉️ 도착한 메시지 관리 ({filteredMessages.length}건)</h2>
            
            {/* 💡 [추가] 관리자용 구별 필터 버튼 바 */}
            <div className="flex bg-black/30 rounded-xl p-1 border border-white/5 self-start sm:self-auto">
              <button
                onClick={() => setMessageFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  messageFilter === 'all' ? 'bg-[#d4af37] text-black' : 'text-gray-400'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setMessageFilter('inquiry')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  messageFilter === 'inquiry' ? 'bg-amber-500 text-black' : 'text-gray-400'
                }`}
              >
                팀 문의만
              </button>
              <button
                onClick={() => setMessageFilter('join')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  messageFilter === 'join' ? 'bg-blue-500 text-white' : 'text-gray-400'
                }`}
              >
                참가 신청만
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredMessages.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">해당 카테고리에 도착한 내역이 없습니다.</p>
            ) : (
              filteredMessages.map((msg) => (
                <div key={msg.id} className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-200">{msg.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        msg.type === 'join' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                      }`}>
                        {msg.type === 'join' ? '참가 신청' : '팀 문의'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteMessage(msg.id, msg.name)} 
                      className="text-[11px] text-red-400 hover:text-red-500 font-medium px-2 py-1 transition-colors"
                    >
                      삭제 ❌
                    </button>
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