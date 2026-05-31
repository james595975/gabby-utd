'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  tag: string;
  created_at: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('id', { ascending: false }); // 최신글이 위로 오도록 정렬

        if (!error && data) {
          setNews(data);
        }
      } catch (e) {
        console.error("News fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // 태그별 포인트 컬러 매칭
  const getTagStyles = (tag: string) => {
    switch (tag) {
      case '공지':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case '경기결과':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case '이벤트':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="bg-[#4a1525] text-white min-h-screen font-sans antialiased pb-20">
      
      {/* 상단 네비게이션 헤더 바 */}
      <header className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center border-b border-white/10">
        <Link href="/" className="text-xl font-black tracking-wider text-[#d4af37] flex items-center gap-2">
          🛡️ 계비 UTD
        </Link>
        <Link href="/" className="text-xs bg-black/30 border border-white/10 px-4 py-2 rounded-xl hover:bg-black/50 transition-colors">
          🏠 홈으로 돌아가기
        </Link>
      </header>

      {/* 타이틀 섹션 */}
      <section className="text-center pt-16 pb-12 px-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-[#e5c158] mb-3">📰 구단 소식통</h1>
        <p className="text-gray-300 text-sm sm:text-base">계비 UTD의 최신 공지사항과 생생한 경기 리포트를 확인하세요.</p>
      </section>

      {/* 소식 리스트 구역 */}
      <main className="max-w-5xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">소식을 불러오는 중입니다...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 bg-[#36101b] rounded-3xl border border-white/5 max-w-2xl mx-auto">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-gray-400 text-sm">아직 등록된 구단 소식이 없습니다.</p>
          </div>
        ) : (
          /* 🔥 태블릿/PC 환경에서 시원하게 확대되는 와이드 격자 레이아웃 */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {news.map((item) => (
              <div 
                key={item.id} 
                className="bg-[#36101b] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300 group"
              >
                <div>
                  {/* 이미지 영역 (이미지가 없을 땐 구단 감성의 가상 배경 제공) */}
                  <div className="w-full h-48 sm:h-56 bg-black/40 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-center space-y-2 opacity-40">
                        <span className="text-4xl block">⚽</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold">Gabby UTD News</span>
                      </div>
                    )}
                    {/* 우측 상단 카테고리 태그 */}
                    <span className={`absolute top-4 right-4 text-[10px] sm:text-xs font-black tracking-wider px-3 py-1 rounded-md shadow border ${getTagStyles(item.tag)}`}>
                      {item.tag}
                    </span>
                  </div>

                  {/* 텍스트 컨텐츠 영역 (크기 대폭 빌드업) */}
                  <div className="p-6 sm:p-7 space-y-3">
                    <span className="text-[11px] font-mono text-gray-400 block">
                      📅 {new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white leading-snug tracking-wide group-hover:text-[#text-[#e5c158]] transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 pt-1">
                      {item.content}
                    </p>
                  </div>
                </div>

                {/* 하단 더보기 디자인 바 */}
                <div className="px-6 pb-6 pt-2 border-t border-white/5 flex justify-end">
                  <span className="text-xs font-bold text-[#d4af37] group-hover:underline cursor-pointer flex items-center gap-1">
                    자세히 보기 ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 푸터 구역 */}
      <footer className="max-w-md mx-auto text-center px-4 mt-24 space-y-3 opacity-60">
        <p className="text-xs font-bold text-[#d4af37]/70 tracking-widest uppercase">WE PLAY. WE FIGHT. WE WIN.</p>
        <p className="text-[11px] text-gray-500">© 2026 계비 UTD. All rights reserved.</p>
      </footer>

    </div>
  );
}
