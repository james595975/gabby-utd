'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  tag: string;
  created_at: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>(''); // 🔥 구단 로고 URL 상태 추가
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 구단 로고 이미지 가져오기 (matches 테이블의 첫 번째 데이터 기준)
    const fetchClubLogo = async () => {
      try {
        const { data, error } = await supabase.from('matches').select('home_logo').limit(1);
        if (data && data.length > 0 && !error) {
          setLogoUrl(data[0].home_logo?.trim() || '');
        }
      } catch (e) {
        console.error("Club logo fetch error:", e);
      }
    };

    // 2. 소식 리스트 데이터 가져오기
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('id', { ascending: false });

        if (!error && data) {
          setNews(data);
        }
      } catch (e) {
        console.error("News fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchClubLogo();
    fetchNews();
  }, []);

  const getTagStyles = (tag: string) => {
    switch (tag) {
      case '공지': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case '경기결과': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case '이벤트': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="bg-[#4a1525] text-white min-h-screen font-sans antialiased pb-20">
      
      {/* 상단 네비게이션 헤더 */}
      <header className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center border-b border-white/10">
        {/* 🔥 왼쪽 상단 구단 로고 링크 구역 */}
        <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="w-10 h-10 rounded-full bg-black/30 border-2 border-[#d4af37] flex items-center justify-center overflow-hidden shadow-md">
            {logoUrl ? (
              <img src={logoUrl} alt="Club Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#d4af37] text-xs font-black">UTD</span>
            )}
          </div>
          <span className="text-base sm:text-lg font-black tracking-wider text-white group-hover:text-[#e5c158] transition-colors">
            계비 UTD
          </span>
        </Link>

        <Link href="/" className="text-xs bg-black/30 border border-white/10 px-4 py-2 rounded-xl hover:bg-black/50 transition-colors font-medium">
          🏠 홈 화면
        </Link>
      </header>

      {/* 대타이틀 구역 */}
      <section className="text-center pt-16 pb-12 px-4">
        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-[#e5c158] mb-3">📰 구단 소식통</h1>
        <p className="text-gray-300 text-sm sm:text-base">계비 UTD의 최신 공지사항과 생생한 경기 리포트를 확인하세요.</p>
      </section>

      {/* 메인 소식 피드 리스트 구역 */}
      <main className="max-w-5xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">소식을 불러오는 중입니다...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 bg-[#36101b] rounded-3xl border border-white/5 max-w-2xl mx-auto">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-gray-400 text-sm">아직 등록된 구단 소식이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {news.map((item) => {
              const isExternal = !!item.link_url;
              const targetUrl = item.link_url || '#';

              return (
                <a 
                  href={targetUrl}
                  key={item.id} 
                  target={isExternal ? "_blank" : "_self"}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="bg-[#36101b] rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300 group"
                >
                  <div>
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
                      <span className={`absolute top-4 right-4 text-[10px] sm:text-xs font-black tracking-wider px-3 py-1 rounded-md shadow border ${getTagStyles(item.tag)}`}>
                        {item.tag}
                      </span>
                    </div>

                    <div className="p-6 sm:p-7 space-y-3">
                      <span className="text-[11px] font-mono text-gray-400 block">
                        📅 {new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-white leading-snug tracking-wide group-hover:text-[#e5c158] transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 pt-1">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 border-t border-white/5 flex justify-end">
                    <span className="text-xs font-bold text-[#d4af37] group-hover:underline flex items-center gap-1">
                      {isExternal ? '링크로 이동 ➔' : '상세 내용 없음 ➔'}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>

      {/* 하단 푸터 구역 */}
      <footer className="max-w-md mx-auto text-center px-4 mt-24 space-y-3 opacity-60">
        <p className="text-xs font-bold text-[#d4af37]/70 tracking-widest uppercase">WE PLAY. WE FIGHT. WE WIN.</p>
        <p className="text-[11px] text-gray-500">© 2026 계비 UTD. All rights reserved.</p>
      </footer>

    </div>
  );
}
