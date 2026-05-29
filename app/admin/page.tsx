// app/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Player { id: number; name: string; position: string; }
interface Message { id: number; type: string; name: string; content: string; created_at: string; }

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [name, setName] = useState('');
  const [position, setPosition] = useState('미드필더');
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // 페이지 접속 시 기존 로그인 상태 확인
  useEffect(() => {
    const savedLogin = sessionStorage.getItem('admin_login');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
      fetchData();
    }
  }, []);

  // 로그인 처리 함수
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (passwordInput === correctPassword) {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_login', 'true');
      fetchData();
    } else {
      alert('비밀번호가 일치하지 않습니다.');
      setPasswordInput('');
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_login');
  };

  const fetchData = async () => {
    const { data: pData } = await supabase.from('players').select('*').order('id', { ascending: false });
    if (pData) setPlayers(pData);

    const { data: mData } = await supabase.from('messages').select('*').order('id', { ascending: false });
    if (mData) setMessages(mData);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('이름을 입력해주세요.');
    const { error } = await supabase.from('players').insert([{ name, position }]);
    if (error) alert('등록 실패: ' + error.message);
    else { alert(`${name} 선수 등록 완료!`); setName(''); fetchData(); }
  };

  const handleDeletePlayer = async (id: number, playerName: string) => {
    if (!confirm(`${playerName} 선수를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchData();
  };

  const handleDeleteMessage = async (id: number) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchData();
  };

  // 1. 로그인하지 않은 경우 가로막는 화면
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#36101b] text-white flex items-center justify-center p-6 font-sans">
        <form onSubmit={handleLogin} className="bg-[#4a1525] p-8 rounded-2xl border border-white/5 shadow-2xl w-full max-w-sm space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-black text-[#d4af37] mb-2">계비 UTD</h1>
            <p className="text-xs text-gray-400">관리자 인증이 필요합니다.</p>
          </div>
          <input 
            type="password" 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="비밀번호 입력" 
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3.5 text-center text-sm text-white focus:outline-none focus:border-[#d4af37]"
          />
          <button type="submit" className="w-full bg-[#d4af37] text-black font-bold py-3.5 rounded-xl text-sm shadow-md hover:bg-[#c4a030] transition-colors">
            🔓 인증하기
          </button>
        </form>
      </div>
    );
  }

  // 2. 로그인 성공 시 보여주는 실제 관리자 화면
  return (
    <div className="min-h-screen bg-[#36101b] text-white p-6 font-sans pb-20">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-[#d4af37] mb-2">계비 UTD 관리자</h1>
            <p className="text-xs text-gray-400">선수단 구성 및 수신된 문의를 관리합니다.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-gray-300 hover:bg-white/20 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 선수 등록 폼 */}
        <form onSubmit={handleAddPlayer} className="bg-[#4a1525] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-[#d4af37]">🏃‍♂️ 새 선수 등록</h2>
          <div className="space-y-3">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="선수 이름" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]" />
            <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"><option value="스트라이커" className="bg-[#4a1525]">스트라이커</option><option value="미드필더" className="bg-[#4a1525]">미드필더</option><option value="수비수" className="bg-[#4a1525]">수비수</option><option value="골키퍼" className="bg-[#4a1525]">골키퍼</option></select>
          </div>
          <button type="submit" className="w-full bg-[#d4af37] text-black font-bold py-3.5 rounded-xl text-sm shadow-md hover:bg-[#c4a030] transition-colors">➕ 선수 등록하기</button>
        </form>

        {/* 현재 선수 명단 */}
        <div className="bg-[#4a1525] p-6 rounded-2xl border border-white/5 shadow-xl">
          <h2 className="text-sm font-bold text-gray-300 mb-4">👥 현재 명단 ({players.length}명)</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {players.map((player) => (
              <div key={player.id} className="flex justify-between items-center bg-black/10 p-3 rounded-xl border border-white/5">
                <div><span className="font-bold text-sm mr-2">{player.name}</span><span className="text-[10px] text-gray-400">{player.position}</span></div>
                <button onClick={() => handleDeletePlayer(player.id, player.name)} className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-md hover:bg-red-500 hover:text-white">삭제</button>
              </div>
            ))}
          </div>
        </div>

        {/* 받은 문의/가입 메시지함 */}
        <div className="bg-[#4a1525] p-6 rounded-2xl border border-white/5 shadow-xl">
          <h2 className="text-sm font-bold text-gray-300 mb-4">📥 받은 문의 및 신청 ({messages.length}개)</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2 relative">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${msg.type === 'join' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {msg.type === 'join' ? '팀 참가 신청' : '팀 문의'}
                  </span>
                  <button onClick={() => handleDeleteMessage(msg.id)} className="text-[10px] text-gray-500 hover:text-red-400">삭제</button>
                </div>
                <div className="text-sm font-bold text-gray-200">보낸이: {msg.name}</div>
                <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed bg-black/10 p-2.5 rounded-lg border border-white/5">{msg.content}</p>
                <div className="text-[9px] text-gray-500 text-right">{new Date(msg.created_at).toLocaleDateString()}</div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-xs text-gray-500 text-center py-4">도착한 메시지가 없습니다.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}