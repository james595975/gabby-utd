'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface ScheduleItem {
  id: number;
  opponent: string;
  opponent_logo?: string | null;
  away_logo?: string | null;
  match_date: string;
  match_time?: string | null;
  location?: string | null;
  match_type?: string | null;
  note?: string | null;
}

const DEFAULT_HOME_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/home_icon/home_icon.jpg';
const DEFAULT_AWAY_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg';

function cleanLogoUrl(value: string | null | undefined, fallback: string) {
  const url = String(value || '').replace(/\s+/g, '').trim();
  return url.startsWith('http') ? url : fallback;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedules() {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .order('match_date', { ascending: true })
          .order('match_time', { ascending: true, nullsFirst: false });

        if (!error && data) setSchedules(data);
      } catch (error) {
        console.error('Schedule fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSchedules();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-16">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-wider hover:text-[#f2d272] transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DEFAULT_HOME_LOGO} alt="Gabby UTD" className="h-7 w-7 rounded-full object-cover" />
            Gabby UTD
          </Link>
          <div className="flex gap-4 text-xs font-bold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">메인 홈</Link>
            <Link href="/matches" className="hover:text-white transition-colors">MATCHES</Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 pt-10">
        <div className="mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f2d272]">Fixtures</span>
          <h1 className="mt-2 text-3xl font-black">경기 일정</h1>
          <p className="mt-2 text-sm text-gray-500">Gabby UTD의 예정 경기와 운영 메모를 확인할 수 있습니다.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center text-sm text-gray-400">일정을 불러오는 중...</div>
        ) : schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-16 text-center text-sm text-gray-500">등록된 일정이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const awayLogo = cleanLogoUrl(schedule.opponent_logo || schedule.away_logo, DEFAULT_AWAY_LOGO);
              const dateLabel = new Date(schedule.match_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

              return (
                <article key={schedule.id} className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-2xl transition-colors hover:border-white/25">
                  <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={DEFAULT_HOME_LOGO} alt="Gabby UTD" className="h-12 w-12 rounded-full border border-white/10 bg-black object-cover p-0.5" />
                      <div>
                        <p className="text-sm font-black">Gabby UTD</p>
                        <p className="text-[10px] font-bold text-[#f2d272]">HOME</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-center">
                      <p className="text-xs font-black text-[#f2d272]">{schedule.match_type || '공식전'}</p>
                      <p className="mt-2 text-lg font-black">{dateLabel}</p>
                      {schedule.match_time && <p className="mt-1 text-sm font-bold text-gray-300">{schedule.match_time.slice(0, 5)}</p>}
                      <p className="mt-1 text-xs font-bold text-gray-500">{schedule.location || '장소 미정'}</p>
                    </div>

                    <div className="flex items-center gap-3 md:justify-end">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={awayLogo}
                        alt={schedule.opponent}
                        className="h-12 w-12 rounded-full border border-white/10 bg-black object-cover p-0.5"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_AWAY_LOGO;
                        }}
                      />
                      <div className="md:text-right">
                        <p className="text-sm font-black">{schedule.opponent}</p>
                        <p className="text-[10px] font-bold text-gray-500">AWAY</p>
                      </div>
                    </div>
                  </div>

                  {schedule.note && <p className="mt-4 rounded-xl bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-gray-400">{schedule.note}</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
