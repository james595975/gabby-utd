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
  is_practice: boolean; 
  match_result: string; 
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeLogo, setHomeLogo] = useState('');
  const [awayLogo, setAwayLogo] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [isPractice, setIsPractice] = useState(false); 
  const [matchResult, setMatchResult] = useState('무승부'); 

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('미드필더');

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
      setIsLoading(true);
      const { data: pData } = await supabase.from('players').select('*').order('id', { ascending: true });
      if (pData) setPlayers(pData);

      const { data: mData } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (mData) setMessages(mData);

      const { data: matchData, error: matchError } = await supabase.schema('public').from('matches').select('*');
      if (matchData && !matchError) setMatches(matchData);
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
          match_result: matchResult
        })
        .eq('id', editingMatchId);

      if (error) {
        alert("등록 실패: " + error.message);
      } else {
        alert("경기 결과가 성공적으로 업데이트되었습니다!");
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
    const { error } = await supabase.from('players').insert([{ name: newPlayerName.trim(), position: newPlayerPosition }]);
    if (!error) {
      setNewPlayerName('');
      fetchData();
    }
  };

  const handleDeletePlayer = async (id: number, name: string) => {
    if (!confirm(`${name} 선수를 명단에서 제외하시겠습니까?`)) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (!error) fetchData();
  };

  const startEdit = (match: MatchData) => {
    setEditingMatchId(match.id);
    setHomeScore(match.home_score);
    setAwayScore(match.away_score);
    setHomeLogo(match.home_logo || '');
    setAwayLogo(match.away_logo || '');
    setHomeTeam(match.home_team || '잔뇨 FC');
    setAwayTeam(match.away_team || '계비 유나이티드');
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
    <div className="bg-[#1e060c] min-h-screen text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h1 className="text-2xl font-black text-[#d4af37]">🛡️ 구단 관리 센터</h1>
          <button onClick={handleLogout} className="text-xs bg-red-900/40 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg">로그아웃</button>
        </div>

        {/* 경기 관리 */}
        <section className="bg-[#36101b] p-6 rounded-2xl border border-white/5">
          <h2 className="text-lg font-bold mb-4">📊 경기 결과 설정</h2>
          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.id} className="border border-white/5 p-4 rounded-xl bg-black/10">
                {editingMatchId === m.id ? (
                  <form onSubmit={handleUpdateMatch} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="홈팀" className="bg-black/40 border border-white/10 p-2 rounded text-xs" />
                      <input type="text" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="원정팀" className="bg-black/40 border border-white/10 p-2 rounded text-xs" />
                      <input type="number" value={homeScore} onChange={(e) => setHomeScore(Number(e.target.value))} placeholder="홈 스코어" className="bg-black/40 border border-white/10 p-2 rounded text-xs" />
                      <input type="number" value={awayScore} onChange={(e) => setAwayScore(Number(e.target.value))} placeholder="원정 스코어" className="bg-black/40 border border-white/10 p-2 rounded text-xs" />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" id="isPractice" checked={isPractice} onChange={(e) => setIsPractice(e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                      <label htmlFor="isPractice" className="text-xs font-bold text-amber-400 cursor-pointer">🛠️ 연습 경기 표시</label>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <label className="block text-[10px] text-gray-400 font-bold">🎯 결과 선택</label>
                      <div className="flex gap-4 items-center">
                        {['승리', '패배', '무승부'].map((res) => (
                          <label key={res} className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                            <input type="radio" name="resultGroup" value={res} checked={matchResult === res} onChange={(e) => setMatchResult(e.target.value)} />
                            {res === '승리' ? '🟢 승리' : res === '패배' ? '🔴 패배' : '⚪ 무승부'}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="bg-green-600 px-4 py-2 rounded text-xs font-bold">💾 저장</button>
                      <button type="button" onClick={() => setEditingMatchId(null)} className="bg-gray-600 px-4 py-2 rounded text-xs">취소</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="text-sm flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${m.match_result === '승리' ? 'bg-green-500 text-black' : m.match_result === '패배' ? 'bg-red-500 text-white' : 'bg-gray-600 text-white'}`}>{m.match_result || '무승부'}</span>
                      <span className="font-bold text-[#d4af37]">{m.home_team}</span> {m.home_score} : {m.away_score} <span>{m.away_team}</span>
                    </div>
                    <button onClick={() => startEdit(m)} className="bg-[#d4af37] text-black px-3 py-1 rounded text-xs font-bold">수정</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
