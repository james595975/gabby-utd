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
          .select('id,title,content,image_url,link_url,tag,created_at')
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
      case '공지': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case '경기결과': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case '이벤트': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-700/20 text-gray-300 border-gray-600/30';
    }
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans antialiased pb-20 relative overflow-hidden">
      
      {/* 🌌 배경 빛 번짐 효과 (좌상단 블루, 우하단 핑크 고정) */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#1a233a]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#3b1028]/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* 📌 상단 네비게이션 헤더 */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3 transition-transform active:scale-95">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-0.5 shadow-[0_0_18px_rgba(242,210,114,0.08)]">
              {logoUrl ? (
                <img src={logoUrl} alt="Gabby UTD" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-[10px] font-black text-[#f2d272]">UTD</span>
              )}
            </div>
            <div className="leading-tight">
              <span className="block text-base font-black tracking-wide text-white transition-colors group-hover:text-[#f2d272]">
                Gabby UTD
              </span>
              <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.22em] text-[#f2d272]/80">
                News Room
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] p-1">
            <Link href="/" className="rounded-full px-3.5 py-2 text-xs font-black text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
              홈
            </Link>
            <Link href="/matches" className="hidden rounded-full px-3.5 py-2 text-xs font-black text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:block">
              경기 기록
            </Link>
          </div>
        </div>
      </nav>

      {/* 📢 대타이틀 구역 */}
      <section className="text-center pt-16 pb-12 px-4 relative z-10">
        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-white mb-3 flex items-center justify-center gap-2">
          <span>📰</span> 구단 소식통
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto tracking-wide leading-relaxed">
          Gabby UTD의 최신 공지사항과 생생한 경기 리포트를 확인하세요.
        </p>
      </section>

      {/* 📜 메인 소식 피드 리스트 구역 */}
      <main className="max-w-5xl mx-auto px-4 relative z-10">
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">소식을 불러오는 중입니다...</div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-dashed border-gray-700/50 max-w-2xl mx-auto shadow-xl">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-gray-500 text-sm">아직 등록된 구단 소식이 없습니다.</p>
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
                  className="bg-[#0a0a0a] rounded-2xl border border-gray-800/60 shadow-xl overflow-hidden flex flex-col justify-between hover:border-gray-500/50 hover:bg-[#111] transition-all duration-300 group"
                >
                  <div>
                    {/* 이미지 썸네일 영역 */}
                    <div className="w-full h-48 sm:h-56 bg-black/40 relative overflow-hidden flex items-center justify-center border-b border-gray-800/60">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-center space-y-2 opacity-20 group-hover:opacity-30 transition-opacity">
                          <span className="text-4xl block">⚽</span>
                          <span className="text-[10px] uppercase tracking-widest font-black block">Gabby UTD News</span>
                        </div>
                      )}
                      <span className={`absolute top-4 right-4 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md shadow-sm border backdrop-blur-md ${getTagStyles(item.tag)}`}>
                        {item.tag}
                      </span>
                    </div>

                    {/* 텍스트 컨텐츠 영역 */}
                    <div className="p-6 sm:p-7 space-y-3">
                      <span className="text-[10px] font-mono font-bold text-gray-500 block">
                        🗓️ {new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <h2 className="text-lg font-black text-gray-200 leading-snug tracking-wide group-hover:text-[#f2d272] transition-colors line-clamp-2">
                        {item.title}
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 pt-1 font-medium">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  {/* 하단 화살표 링크 바 */}
                  <div className="px-6 pb-5 pt-3 border-t border-gray-900/60 flex justify-end">
                    <span className="text-xs font-bold text-[#f2d272] group-hover:underline flex items-center gap-1">
                      {isExternal ? '링크로 이동 ➔' : '상세 내용 없음 ➔'}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>

      {/* 🏁 하단 푸터 구역 */}
      <footer className="max-w-md mx-auto text-center px-4 mt-24 space-y-2 opacity-40 relative z-10">
        <p className="text-[10px] font-bold text-[#f2d272] tracking-widest uppercase">언제나 함께, 끝까지 승리를 위하여</p>
        <p className="text-[10px] font-mono text-gray-500">© 2026 계비 UTD. All rights reserved.</p>
      </footer>

    </div>
  );
}
