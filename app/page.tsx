// app/page.tsx
'use client';
import { useState } from 'react';

export default function Home() {
  // 연락하기 폼 탭 상태 관리 ('inquiry': 팀 문의, 'join': 팀 참가 신청)
  const [activeTab, setActiveTab] = useState<'inquiry' | 'join'>('inquiry');

  // 임시 선수 데이터 (나중에 Supabase DB와 연동할 부분입니다)
  const dummyPlayers = [
    { id: 1, name: '김규혁', position: '미드필더' },
    { id: 2, name: '김동우', position: '수비수' },
    { id: 3, name: '김정민', position: '스트라이커' },
    { id: 4, name: '박정민', position: '스트라이커' },
  ];

  return (
    <div className="bg-[#4a1525] text-white min-h-screen font-sans antialiased selection:bg-pink-500 selection:text-white">
      
      {/* 1. 히어로 섹션 */}
      <section className="flex flex-col items-center justify-center text-center pt-20 pb-16 px-4">
        {/* 로고 들어갈 자리 (public 폴더에 로고 이미지를 넣은 후 경로를 지정하면 됩니다) */}
        <div className="w-40 h-40 rounded-full bg-black/30 border-4 border-[#d4af37] flex items-center justify-center overflow-hidden shadow-2xl mb-6">
          <span className="text-gray-400 text-sm">계비 UTD 로고</span>
        </div>
        <h1 className="text-4xl font-black tracking-wider mb-2">계비 UTD</h1>
        <p className="text-[#d4af37] text-lg font-bold tracking-widest mb-4">WE PLAY. WE FIGHT. WE WIN.</p>
        <p className="text-gray-300 text-sm">2026년 창립 | 열정과 도전의 축구팀</p>
      </section>

      {/* 2. 팀 소개 섹션 */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">
          🛡️ 팀 소개
        </h2>
        <div className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg text-center leading-relaxed text-gray-200 text-sm">
          <strong className="text-[#d4af37]">계비 UTD</strong>는 열정 넘치는 축구팀입니다. 
          "WE PLAY. WE FIGHT. WE WIN."이라는 모토 아래, 팀원들과 함께 경기를 즐기며 성장하고 있습니다. 
          승리보다 중요한 것은 함께하는 즐거움이라는 가치를 추구합니다.
        </div>
      </section>

      {/* 3. 선수 명단 섹션 */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">
          👥 선수 명단
        </h2>
        {/* 포지션 가이드 뱃지 */}
        <div className="flex justify-center gap-4 text-xs text-gray-400 mb-6">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> 스트라이커</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> 미드필더</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 수비수</span>
        </div>
        {/* 선수 카드 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {dummyPlayers.map((player) => (
            <div key={player.id} className="bg-[#36101b] rounded-2xl p-6 flex flex-col items-center border border-white/5 shadow-md">
              <div className="w-14 h-14 rounded-full border-2 border-[#d4af37]/50 flex items-center justify-center mb-3 text-2xl bg-black/10">
                👤
              </div>
              <div className="font-bold text-base mb-2">{player.name}</div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                player.position === '스트라이커' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                player.position === '미드필더' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {player.position}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 경기 기록 섹션 */}
      <section className="max-w-md mx-auto px-4 mb-16">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">
          🏆 경기 기록
        </h2>
        <div className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg relative">
          <span className="absolute top-4 right-4 text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-300">연습경기</span>
          <p className="text-xs text-gray-400 mb-4">📅 2026년 5월 29일</p>
          <div className="text-center space-y-2">
            <h3 className="text-[#d4af37] font-semibold text-sm">계비 UTD</h3>
            <p className="text-3xl font-black tracking-wider">2 - 7</p>
            <h3 className="text-gray-300 font-semibold text-sm">상대 팀 이름</h3>
            <p className="text-xs text-red-400 font-medium pt-2">패배</p>
          </div>
        </div>
      </section>

      {/* 5. 연락하기 섹션 */}
      <section className="max-w-md mx-auto px-4 pb-20">
        <h2 className="text-xl font-bold flex justify-center items-center gap-2 mb-4">
          ✉️ 연락하기
        </h2>
        {/* 탭 버튼 */}
        <div className="flex bg-black/20 p-1 rounded-xl mb-4">
          <button 
            onClick={() => setActiveTab('inquiry')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'inquiry' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400'}`}
          >
            📩 팀 문의
          </button>
          <button 
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'join' ? 'bg-[#d4af37] text-black shadow' : 'text-gray-400'}`}
          >
            👤 팀 참가 신청
          </button>
        </div>

        {/* 입력 폼 */}
        <div className="bg-[#36101b] rounded-2xl p-6 border border-white/5 shadow-lg space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">이름 *</label>
            <input type="text" placeholder="홍길동" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#d4af37]" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">이메일 *</label>
            <input type="email" placeholder="example@email.com" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#d4af37]" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">연락처 *</label>
            <input type="text" placeholder="010-1234-5678" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#d4af37]" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">내용 *</label>
            <textarea rows={4} placeholder={activeTab === 'inquiry' ? "문의하실 내용을 작성해주세요." : "포지션, 주발, 출신 팀 등 소개를 작성해주세요."} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#d4af37] resize-none"></textarea>
          </div>
          <button className="w-full bg-[#d4af37] text-black font-bold py-3.5 rounded-xl text-sm shadow-md hover:bg-[#c4a030] transition-colors">
            🚀 전송하기
          </button>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="text-center py-8 border-t border-white/5 bg-black/10 text-xs text-gray-500">
        <p className="mb-2">© 2026 계비 UTD. All rights reserved.</p>
      </footer>
    </div>
  );
}