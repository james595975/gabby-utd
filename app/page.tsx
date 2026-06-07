'use client';

import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import SiteHamburgerMenu from './components/SiteHamburgerMenu';

// 서버 액션 임포트 (경로가 다를 경우 @/app/actions 등으로 수정해주세요)
import { sendInquiryEmail } from './actions'; 

const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/gabby.utd?igsh=YWk4N2FiZGo4Nnht';

interface Player { 
  id: number; 
  name: string; 
  position: string; 
  back_number?: number; // 🔢 등번호 컬럼 추가
  lineup_spot?: number | null; // ⚽ 라인업 배치 구역 컬럼 추가
}

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
  round_number?: number | null;
}

interface GoalData {
  id: number;
  match_id: number;
  scorer_name: string;
  minute?: number | null;
  team: 'home' | 'away';
  note?: string | null;
}

interface NewsItem {
  id: number | string;
  title: string;
  content: string;
  image_url?: string;
  link_url?: string | null;
  tag: string;
  created_at: string;
}

interface InstagramPost {
  id: string;
  caption: string;
  image_url?: string | null;
  permalink?: string | null;
  timestamp?: string | null;
}

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

// 🟢 전술판 위의 선수 마커 컴포넌트
interface PlayerDotProps {
  number: string;
  name: string;
  isGK?: boolean;
}

const PlayerDot = memo(function PlayerDot({ number, name, isGK = false }: PlayerDotProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-1.5 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
      {/* 🔴 등번호가 들어가는 원형 마커 (크기 확대: w-8 h-8 -> w-10 h-10) */}
      <div 
        className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-black border-2 transition-transform duration-300 hover:scale-110 ${
          isGK 
            ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
            : 'bg-green-500 text-white border-green-300 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
        }`}
      >
        {/* 🔢 등번호 글자 크기 확대 (text-xs -> text-sm ~ base) */}
        <span className="text-sm sm:text-base tracking-tighter">
          {number}
        </span>
      </div>

      {/* 🏃 선수 이름 레이블 박스 (폰트 크기 및 패딩 대폭 확대) */}
      {name && (
        <div className="bg-black/85 border border-gray-700/60 px-2.5 py-1 rounded-md max-w-[90px] sm:max-w-[120px] truncate text-center backdrop-blur-sm">
          {/* 🔤 이름 글자 크기 확대 (text-[10px] -> text-xs ~ sm) */}
          <span className="block text-xs sm:text-sm font-black text-gray-100 tracking-tight whitespace-nowrap truncate">
            {name}
          </span>
        </div>
      )}
    </div>
  );
});

function cleanLogoUrl(value: string | null | undefined, fallback: string) {
  const url = String(value || '').replace(/\s+/g, '').trim();
  return url.startsWith('http') ? url : fallback;
}

function formatGoalList(goals: GoalData[]) {
  return goals
    .map((goal) => `${goal.scorer_name}${goal.minute ? ` ${goal.minute}'` : ''}`)
    .join(' · ');
}

const FORMATION_STYLES: Record<string, Record<number, { top: string; left: string }>> = {
  '4-4-2': {
    1: { top: '88%', left: '50%' },   // GK
    2: { top: '70%', left: '15%' },   // LB
    3: { top: '73%', left: '38%' },   // LCB
    4: { top: '73%', left: '62%' },   // RCB
    5: { top: '70%', left: '85%' },   // RB
    6: { top: '48%', left: '15%' },   // LM
    7: { top: '50%', left: '38%' },   // LCM
    8: { top: '50%', left: '62%' },   // RCM
    9: { top: '48%', left: '85%' },   // RM
    10: { top: '22%', left: '35%' },  // LS
    11: { top: '22%', left: '65%' },  // RS
  },
  '5-3-2': {
    1: { top: '88%', left: '50%' },   // GK
    2: { top: '65%', left: '12%' },   // LWB
    3: { top: '73%', left: '30%' },   // LCB
    9: { top: '75%', left: '50%' },   // CB (5백 중심 수비)
    4: { top: '73%', left: '70%' },   // RCB
    5: { top: '65%', left: '88%' },   // RWB
    6: { top: '46%', left: '28%' },   // LCM
    7: { top: '48%', left: '50%' },   // CM
    8: { top: '46%', left: '72%' },   // RCM
    10: { top: '22%', left: '35%' },  // LS
    11: { top: '22%', left: '65%' },  // RS
  },
  '4-3-3': {
    1: { top: '88%', left: '50%' },   // GK
    2: { top: '70%', left: '15%' },   // LB
    3: { top: '73%', left: '36%' },   // LCB
    4: { top: '73%', left: '64%' },   // RCB
    5: { top: '70%', left: '85%' },   // RB
    6: { top: '50%', left: '25%' },   // LCM
    7: { top: '53%', left: '50%' },   // CM
    8: { top: '50%', left: '75%' },   // RCM
    9: { top: '24%', left: '18%' },   // LW
    10: { top: '20%', left: '50%' },  // ST
    11: { top: '24%', left: '82%' },  // RW
  },
  '3-5-2': {
    1: { top: '88%', left: '50%' },   // GK
    2: { top: '73%', left: '25%' },   // LCB
    3: { top: '75%', left: '50%' },   // CB
    4: { top: '73%', left: '75%' },   // RCB
    9: { top: '50%', left: '12%' },   // LM
    6: { top: '52%', left: '34%' },   // LCM
    7: { top: '56%', left: '50%' },   // CDM
    8: { top: '52%', left: '66%' },   // RCM
    5: { top: '50%', left: '88%' },   // RM
    10: { top: '22%', left: '35%' },  // LS
    11: { top: '22%', left: '65%' },  // RS
  },
  '4-2-3-1': {
    1: { top: '88%', left: '50%' },
    2: { top: '70%', left: '14%' },
    3: { top: '73%', left: '36%' },
    4: { top: '73%', left: '64%' },
    5: { top: '70%', left: '86%' },
    6: { top: '55%', left: '38%' },
    7: { top: '55%', left: '62%' },
    8: { top: '38%', left: '18%' },
    9: { top: '36%', left: '50%' },
    10: { top: '38%', left: '82%' },
    11: { top: '18%', left: '50%' },
  },
  '4-1-4-1': {
    1: { top: '88%', left: '50%' },
    2: { top: '70%', left: '15%' },
    3: { top: '73%', left: '38%' },
    4: { top: '73%', left: '62%' },
    5: { top: '70%', left: '85%' },
    6: { top: '57%', left: '50%' },
    7: { top: '40%', left: '14%' },
    8: { top: '42%', left: '38%' },
    9: { top: '42%', left: '62%' },
    10: { top: '40%', left: '86%' },
    11: { top: '18%', left: '50%' },
  },
  '3-4-3': {
    1: { top: '88%', left: '50%' },
    2: { top: '73%', left: '25%' },
    3: { top: '76%', left: '50%' },
    4: { top: '73%', left: '75%' },
    5: { top: '50%', left: '12%' },
    6: { top: '52%', left: '38%' },
    7: { top: '52%', left: '62%' },
    8: { top: '50%', left: '88%' },
    9: { top: '24%', left: '18%' },
    10: { top: '18%', left: '50%' },
    11: { top: '24%', left: '82%' },
  },
  '4-5-1': {
    1: { top: '88%', left: '50%' },
    2: { top: '70%', left: '15%' },
    3: { top: '73%', left: '38%' },
    4: { top: '73%', left: '62%' },
    5: { top: '70%', left: '85%' },
    6: { top: '47%', left: '12%' },
    7: { top: '50%', left: '32%' },
    8: { top: '53%', left: '50%' },
    9: { top: '50%', left: '68%' },
    10: { top: '47%', left: '88%' },
    11: { top: '20%', left: '50%' },
  },
  '3-4-1-2': {
    1: { top: '88%', left: '50%' },
    2: { top: '73%', left: '25%' },
    3: { top: '76%', left: '50%' },
    4: { top: '73%', left: '75%' },
    5: { top: '50%', left: '12%' },
    6: { top: '52%', left: '38%' },
    7: { top: '52%', left: '62%' },
    8: { top: '50%', left: '88%' },
    9: { top: '34%', left: '50%' },
    10: { top: '17%', left: '36%' },
    11: { top: '17%', left: '64%' },
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'inquiry' | 'join'>('inquiry');
  const [formation, setFormation] = useState<string>('4-3-3');
  const [players, setPlayers] = useState<Player[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [recentMatchGoals, setRecentMatchGoals] = useState<GoalData[]>([]);
  const [nextSchedule, setNextSchedule] = useState<ScheduleItem | null>(null);

  // 로딩 및 폼 상태 관리
  const [matchLoading, setMatchLoading] = useState<boolean>(true);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(true);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [senderName, setSenderName] = useState('');

  // ✨ 이메일 입력 방식 고도화 상태 변수
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('naver.com');
  const [domainSelect, setDomainSelect] = useState('naver.com');

  const [phone, setPhone] = useState(''); 
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEFAULT_HOME_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/home_icon/home_icon.jpg'; 
  const DEFAULT_AWAY_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg';
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id,name,position,back_number,lineup_spot')
        .order('id', { ascending: true });
      if (!error && data) setPlayers(data);
    };

    const fetchNews = async () => {
      try {
        const [{ data, error }, instagramResponse] = await Promise.all([
          supabase
          .from('news')
          .select('id,title,content,image_url,link_url,tag,created_at')
          .order('id', { ascending: false })
            .limit(3),
          fetch('/api/instagram').catch(() => null),
        ]);

        const instagramPayload = instagramResponse?.ok ? await instagramResponse.json() : { posts: [] };
        const instagramNews: NewsItem[] = (instagramPayload.posts || []).map((post: InstagramPost) => {
          const caption = post.caption || 'Instagram 게시글';
          const title = caption.split('\n').find(Boolean)?.slice(0, 48) || 'Instagram 게시글';
          return {
            id: `instagram-${post.id}`,
            title,
            content: caption,
            image_url: post.image_url || undefined,
            link_url: post.permalink || INSTAGRAM_URL,
            tag: 'Instagram',
            created_at: post.timestamp || new Date().toISOString(),
          };
        });

        if (!error) {
          setNews([...(data || []), ...instagramNews]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3));
        }
      } catch (e) {
        console.error("News fetch error on home:", e);
      } finally {
        setNewsLoading(false);
      }
    };

    const fetchMatchData = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id,home_team,away_team,home_score,away_score,home_logo,away_logo,date,is_practice,match_result,round_number')
          .order('id', { ascending: false })
          .limit(1);
        if (data && data.length > 0 && !error) {
          const latestMatch = data[0];
          setMatch(latestMatch);

          const { data: goalData, error: goalError } = await supabase
            .from('match_goals')
            .select('id,match_id,scorer_name,minute,team,note')
            .eq('match_id', latestMatch.id)
            .order('minute', { ascending: true, nullsFirst: false })
            .order('id', { ascending: true });

          if (!goalError && goalData) {
            setRecentMatchGoals(goalData);
          }
        } else {
          setRecentMatchGoals([]);
        }
      } catch (e) {
        console.error("Match data fetch error on home:", e);
      } finally {
        setMatchLoading(false);
      }
    };
     const fetchNextSchedule = async () => {
       try {
         const todayDate = new Date().toISOString().slice(0, 10);
         const { data, error } = await supabase
        .from('schedules')
        .select('id,opponent,opponent_logo,away_logo,match_date,match_time,location,match_type,note')
        .gte('match_date', todayDate)
        .order('match_date', { ascending: true })
        .limit(1);

       if (data && data.length > 0 && !error) {
         const rawSchedule = data[0];
         setNextSchedule({
           ...rawSchedule,
           opponent_logo: cleanLogoUrl(rawSchedule.opponent_logo || rawSchedule.away_logo, DEFAULT_AWAY_LOGO),
         });
       }
     } catch (e) {
       console.error("Schedule fetch error on home:", e);
     } finally {
       setScheduleLoading(false);
     }
   };
    const fetchFormation = async () => {
      try {
        const { data, error } = await supabase
          .from('formations')
          .select('current_formation')
          .eq('id', 1)
          .single();
        if (data && !error) {
          setFormation(data.current_formation);
        }
      } catch (e) {
        console.error("Formation fetch error:", e);
      }
    };
    fetchPlayers();
    fetchNews();
    fetchMatchData();
    fetchNextSchedule();
    fetchFormation();
  }, []);

  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoScrollLoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollingRef = useRef(false);
  const autoScrollLastFrameRef = useRef<number | null>(null);
  const autoScrollCarryRef = useRef(0);

  useEffect(() => {
    const autoScrollPixelsPerSecond = 36;

    const clearLoopTimer = () => {
      if (autoScrollLoopTimerRef.current) {
        clearTimeout(autoScrollLoopTimerRef.current);
        autoScrollLoopTimerRef.current = null;
      }
    };

    const stopAutoScroll = (clearLoop = true) => {
      isAutoScrollingRef.current = false;
      autoScrollLastFrameRef.current = null;
      autoScrollCarryRef.current = 0;
      if (clearLoop) {
        clearLoopTimer();
      }
      if (autoScrollFrameRef.current !== null) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
    };

    const startAutoScroll = () => {
      if (isAutoScrollingRef.current) return;
      isAutoScrollingRef.current = true;
      autoScrollLastFrameRef.current = null;

      const tick = (timestamp: number) => {
        if (!isAutoScrollingRef.current) return;

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) {
          autoScrollFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const lastFrame = autoScrollLastFrameRef.current ?? timestamp;
        const deltaSeconds = Math.min((timestamp - lastFrame) / 1000, 0.1);
        autoScrollLastFrameRef.current = timestamp;
        autoScrollCarryRef.current += autoScrollPixelsPerSecond * deltaSeconds;
        const moveBy = Math.floor(autoScrollCarryRef.current);

        if (window.scrollY >= maxScroll - 2) {
          stopAutoScroll(false);
          autoScrollLoopTimerRef.current = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            autoScrollLoopTimerRef.current = setTimeout(startAutoScroll, 1200);
          }, 2000);
          return;
        } else if (moveBy > 0) {
          autoScrollCarryRef.current -= moveBy;
          window.scrollBy({ top: moveBy, behavior: 'auto' });
        }

        autoScrollFrameRef.current = requestAnimationFrame(tick);
      };

      autoScrollFrameRef.current = requestAnimationFrame(tick);
    };

    const pauseForUserControl = () => {
      stopAutoScroll();
      if (autoScrollResumeTimerRef.current) {
        clearTimeout(autoScrollResumeTimerRef.current);
      }
      autoScrollResumeTimerRef.current = setTimeout(startAutoScroll, 30000);
    };

    startAutoScroll();

    const interactionEvents: Array<keyof WindowEventMap> = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, pauseForUserControl, { passive: true });
    });

    return () => {
      stopAutoScroll();
      if (autoScrollResumeTimerRef.current) {
        clearTimeout(autoScrollResumeTimerRef.current);
      }
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, pauseForUserControl);
      });
    };
  }, []);

  const getPositionStyles = (pos: string) => {
    const cleanPos = pos ? pos.trim() : '';
    if (cleanPos.includes('스트라이커') || cleanPos.toLowerCase().includes('fw') || cleanPos.includes('공격수')) {
      return { 
        label: '스트라이커', 
        cardClass: 'bg-gradient-to-br from-[#4c161c] to-[#2d0a0e] border-red-500/20 hover:border-red-500/40',
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40' 
      };
    }
    if (cleanPos.includes('미드필더') || cleanPos.toLowerCase().includes('mf') || cleanPos.includes('중원')) {
      return { 
        label: '미드필더', 
        cardClass: 'bg-gradient-to-br from-[#143d28] to-[#0a2214] border-emerald-500/20 hover:border-emerald-500/40',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
      };
    }
    if (cleanPos.includes('골키퍼') || cleanPos.toLowerCase().includes('gk')) {
      return { 
        label: '골키퍼', 
        cardClass: 'bg-gradient-to-br from-[#3d3214] to-[#221a0a] border-amber-500/20 hover:border-amber-500/40',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
      };
    }
    return { 
      label: cleanPos || '수비수', 
      cardClass: 'bg-gradient-to-br from-[#162a4c] to-[#0a1428] border-blue-500/20 hover:border-blue-500/40',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
    };
  };

  const getTagStyles = (tag: string) => {
    switch (tag) {
      case '공지': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case '경기결과': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case '이벤트': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullEmail = `${emailId.trim()}@${emailDomain.trim()}`;

    if (!senderName.trim() || !emailId.trim() || !emailDomain.trim() || !phone.trim() || !content.trim()) {
      return alert('필수 항목(*)을 모두 입력해 주세요.');
    }

    const nameRegex = /^[a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/;
    if (!nameRegex.test(senderName.trim())) {
      return alert('이름 필드에는 문자(한글 또는 영문)만 입력할 수 있습니다.');
    }

    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(phone.trim())) {
      return alert('연락처 필드에는 숫자만 입력할 수 있습니다.');
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('messages')
        .insert([
          { 
            type: activeTab, 
            name: senderName.trim(), 
            content: `[이메일: ${fullEmail} / 연락처: ${phone.trim()}]\n\n내용:\n${content.trim()}` 
          }
        ]);

      if (error) {
        alert('데이터베이스 전송에 실패했습니다: ' + error.message);
        return;
      }

      const emailResult = await sendInquiryEmail({
        type: activeTab,
        name: senderName.trim(),
        email: fullEmail,
        phone: phone.trim(),
        content: content.trim()
      });

      if (emailResult.success) {
        alert('Gabby UTD 구단에 정상적으로 접수되었으며, 관리자 메일로 발송되었습니다! 🔥');
        setSenderName('');
        setEmailId('');
        setEmailDomain('naver.com');
        setDomainSelect('naver.com');
        setPhone('');
        setContent('');
      } else {
        alert('DB 저장은 완료되었으나, 알림 메일 발송에 실패했습니다: ' + emailResult.message);
      }
    } catch (err) {
      console.error(err);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // 상단 고정 네비바 높이(약 60px)만큼 여백 확보 후 스크롤
      const offset = 60;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const playersByLineupSpot = useMemo(() => {
    const spotMap = new Map<number, Player>();
    for (const player of players) {
      if (typeof player.lineup_spot === 'number') {
        spotMap.set(player.lineup_spot, player);
      }
    }
    return spotMap;
  }, [players]);

  const lineupDots = useMemo(() => {
    const currentCoords = FORMATION_STYLES[formation] || FORMATION_STYLES['4-4-2'];

    return Array.from({ length: 11 }, (_, index) => {
      const spotId = index + 1;
      const player = playersByLineupSpot.get(spotId);
      const coords = currentCoords[spotId] || { top: '50%', left: '50%' };

      return {
        spotId,
        coords,
        isGK: spotId === 1,
        number: player?.back_number?.toString() || (player ? '?' : '-'),
        name: player?.name || '',
      };
    });
  }, [formation, playersByLineupSpot]);

  const displayHomeTeam = match?.home_team || 'Gabby UTD';
  const displayAwayTeam = match?.away_team || '상대 팀';
  const displayHomeScore = match !== null ? match.home_score : 0;
  const displayAwayScore = match !== null ? match.away_score : 0;
  const displayDate = match?.date || '최근 경기 기록';
  const displayMatchTitle = match?.is_practice
    ? 'FRIENDLY MATCH'
    : match
      ? `DFL ${match.round_number || match.id}ROUND`
      : 'MATCH RESULT';

  const homeLogoUrl = match?.home_logo && match.home_logo.startsWith('http') ? match.home_logo.trim() : DEFAULT_HOME_LOGO;
  const awayLogoUrl = match?.away_logo && match.away_logo.startsWith('http') ? match.away_logo.trim() : DEFAULT_AWAY_LOGO;
  const homeScorers = recentMatchGoals.filter((goal) => goal.team !== 'away');
  const awayScorers = recentMatchGoals.filter((goal) => goal.team === 'away');

  const tem_logo = homeLogoUrl;
  const displayScheduleDate = nextSchedule?.match_date
    ? new Date(nextSchedule.match_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const scheduleAwayLogoUrl = cleanLogoUrl(nextSchedule?.opponent_logo, DEFAULT_AWAY_LOGO);

  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans antialiased selection:bg-[#ff00ff]/30 selection:text-white overflow-x-hidden">
      
      {/* 📌 [고정 및 스캔강화] 최상단 고정 네비게이션 바 */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md px-4 sm:px-6 py-3 shadow-lg transition-all duration-300 sm:py-3.5">
        <div className="max-w-5xl mx-auto relative flex min-h-11 items-center justify-between gap-4">
          {/* 구단 로고 및 이름 */}
          <div 
            onClick={() => scrollToSection('hero')} 
            className="font-black text-sm sm:text-lg tracking-wider text-white hover:text-[#f2d272] transition-colors flex min-w-0 items-center gap-2 cursor-pointer select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={homeLogoUrl} 
              alt="Gabby UTD Mini Logo" 
              className="h-7 w-7 shrink-0 object-contain rounded-full bg-black/20 p-0.5 border border-white/10 sm:h-6 sm:w-6"
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }}
            />
            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate">Gabby UTD</span>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-1 text-[10px] font-black tracking-normal text-[#f2d272] hover:text-white transition-colors"
              >
                Instagram 바로가기
              </a>
            </div>
          </div>

          {/* 중앙 네비게이션 메뉴 링크 */}
          <div className="hidden md:flex flex-wrap justify-center gap-2 sm:gap-3 text-xs font-bold text-gray-400 select-none">
            <button type="button" onClick={() => scrollToSection('hero')} className="rounded-full px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors">홈</button>
            <button type="button" onClick={() => scrollToSection('schedule')} className="rounded-full px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors">일정</button>
            <button type="button" onClick={() => scrollToSection('lineup')} className="rounded-full px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors">라인업</button>
            <button type="button" onClick={() => scrollToSection('players')} className="rounded-full px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors">선수단</button>
            <button type="button" onClick={() => scrollToSection('contact')} className="rounded-full px-2.5 py-1.5 hover:bg-white/5 hover:text-white transition-colors">문의</button>
          </div>

          <div className="shrink-0">
            <SiteHamburgerMenu active="home" />
          </div>
        </div>
      </nav>

      {/* 🌌 1. 히어로 구역 (미드나잇 블루 테마) */}
      <section id="hero" className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden text-center px-5 pb-14 pt-24 bg-gradient-to-b from-[#131a2b]/55 via-[#080b12] to-[#050505] sm:min-h-[80vh] sm:px-4 sm:py-16">
        <div className="absolute left-1/2 top-[18%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#1a233a]/35 blur-[90px] pointer-events-none sm:left-1/4 sm:top-1/4 sm:h-[500px] sm:w-[500px] sm:translate-x-0 sm:blur-[120px]" />
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center sm:max-w-none">
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-black/30 border-4 border-[#1a233a] flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(26,35,58,0.6)] mb-7 sm:mb-6 relative transition-transform hover:scale-105 duration-500">
            <div className="absolute inset-0 rounded-full border border-white/10 m-2 z-20"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={homeLogoUrl} 
              alt="Club Logo" 
              className="w-full h-full object-cover z-10" 
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }}
            />
          </div>
          <span className="text-[#f2d272] uppercase tracking-[0.28em] sm:tracking-[0.3em] text-[11px] sm:text-xs font-bold block mb-4">The New Era of Football</span>
          <h1 className="text-[3.4rem] leading-none sm:text-7xl font-black tracking-tight mb-5 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            {displayHomeTeam}
          </h1>
          <p className="text-gray-300 text-[1.05rem] leading-relaxed sm:text-xl font-medium tracking-[0.14em] sm:tracking-widest mb-11 sm:mb-12 break-keep">
            열정과 함께, 끝까지 승리를 위하여
          </p>

          <div className="grid w-full max-w-xs grid-cols-2 gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center">
            <button
              onClick={() => scrollToSection('schedule')}
              className="bg-[#f2d272] text-black font-bold py-3.5 px-4 sm:px-7 rounded-full hover:bg-white transition-all active:scale-95 shadow-[0_0_20px_rgba(242,210,114,0.3)]"
            >
              다음 경기 보기
            </button>
            <Link href="/matches" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-black text-gray-200 hover:border-[#f2d272]/60 hover:text-white transition-colors sm:px-7">
              경기 결과
            </Link>
          </div>
        </div>
      </section>

      {/* 🖤 2. ทีม 소개 구역 (차콜 블랙) */}
      <section id="about" className="bg-[#050505] w-full py-16 sm:py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-5 relative">
          <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-3xl p-6 sm:p-12 border border-gray-800/60 shadow-2xl text-center relative overflow-hidden">
            <strong className="text-[#f2d272] text-xs sm:text-sm font-black tracking-[0.25em] block mb-4 uppercase">
              ABOUT TEAM
            </strong>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-6 tracking-wide">
              게비 UTD
            </h3>
            <div className="text-gray-400 text-sm sm:text-base leading-relaxed sm:leading-loose space-y-4 break-keep font-medium max-w-2xl mx-auto">
              <p>
                2026년 5월 &quot;열정과 함께, 끝까지 승리를 위하여&quot; 라는 구단 상징 슬로건 아래 창단되었으며,
              </p>
              <p>
                DFL(Dinner Football League)에서 활약하는 타협하지 않는 열정의 축구단입니다.
              </p>
              <p className="text-white font-semibold pt-2">
                언제나 최고의 경기력과 끈끈한 팀워크로<br className="sm:hidden" /> 승리를 향해 전진합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🗓️ 3. 다음 경기 일정 섹션 */}
      <section id="schedule" className="bg-[#050505] w-full py-16 relative z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-col gap-2 text-center mb-6">
            <span className="text-[10px] text-[#f2d272] font-black uppercase tracking-[0.28em]">Next Match</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">다음 경기 일정</h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111] via-[#090909] to-[#141016] shadow-2xl">
            {scheduleLoading ? (
              <div className="py-12 text-center text-sm text-gray-400">다음 경기 일정을 불러오는 중...</div>
            ) : nextSchedule ? (
              <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr]">
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full border border-white/10 bg-black/40 overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={homeLogoUrl} alt="Gabby UTD" className="w-full h-full object-cover p-1" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }} />
                  </div>
                  <p className="text-lg font-black text-white">Gabby UTD</p>
                  <p className="text-[10px] font-bold text-[#f2d272] mt-1">HOME</p>
                </div>

                <div className="flex flex-col items-center justify-center border-y border-white/10 px-8 py-7 text-center md:border-x md:border-y-0">
                  <span className="rounded-full border border-[#f2d272]/30 bg-[#f2d272]/10 px-3 py-1 text-[10px] font-black text-[#f2d272]">
                    {nextSchedule.match_type || '공식전'}
                  </span>
                  <p className="mt-4 text-xl sm:text-2xl font-black text-white">{displayScheduleDate}</p>
                  {nextSchedule.match_time && <p className="mt-1 text-sm font-black text-[#f2d272]">{nextSchedule.match_time.slice(0, 5)} KICK OFF</p>}
                  <p className="mt-2 text-sm font-bold text-gray-400">{nextSchedule.location || '장소 미정'}</p>
                  {nextSchedule.note && <p className="mt-4 max-w-xs text-xs leading-relaxed text-gray-500 break-keep">{nextSchedule.note}</p>}
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Link href="/schedule" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-gray-200 hover:border-[#f2d272]/60 hover:text-white transition-colors">
                      전체 일정
                    </Link>
                    <Link href="/matches" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-gray-200 hover:border-[#f2d272]/60 hover:text-white transition-colors">
                      경기 결과
                    </Link>
                    <button onClick={() => scrollToSection('contact')} className="rounded-full bg-[#f2d272] px-4 py-2 text-xs font-black text-black hover:bg-white transition-colors">
                      참가 문의
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full border border-white/10 bg-black/40 overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scheduleAwayLogoUrl}
                      alt={nextSchedule.opponent}
                      className="w-full h-full object-cover p-1"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_AWAY_LOGO;
                      }}
                    />
                  </div>
                  <p className="text-lg font-black text-white">{nextSchedule.opponent}</p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1">AWAY</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-400">등록된 예정 경기 일정이 없습니다.</div>
            )}
          </div>
        </div>
      </section>

      {/* 📰 4. 최근 구단 소식 섹션 */}
      <section id="news" className="bg-[#050505] w-full py-20 relative z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">최근 소식</h2>
            <Link href="/news" className="text-xs font-bold text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              전체보기 ➔
            </Link>
          </div>

          {newsLoading ? (
            <div className="text-center py-8 text-xs text-gray-400">최신 소식을 로딩 중...</div>
          ) : news.length === 0 ? (
            <div className="text-center py-8 bg-[#111] rounded-2xl border border-white/5 text-xs text-gray-400">
              등록된 구단 소식이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <Link
                  href={item.link_url || '/news'}
                  key={item.id}
                  target={item.link_url ? '_blank' : undefined}
                  rel={item.link_url ? 'noreferrer' : undefined}
                  className="block bg-[#0a0a0a] border border-gray-800/60 hover:border-gray-600 p-5 rounded-2xl shadow-xl transition-all group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded border ${getTagStyles(item.tag)}`}>
                          {item.tag}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(item.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <h3 className="font-black text-sm sm:text-base text-gray-200 group-hover:text-white truncate transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                    {item.image_url && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/50 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt="News thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ⚽ 3.5. 선발 라인업 스쿼드 전술판 섹션 */}
      <section id="lineup" className="bg-[#050505] w-full py-20 border-t border-gray-800/30 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8 text-center sm:text-left">
            <span className="text-[10px] text-green-400 font-mono font-bold block uppercase tracking-widest">Starting Lineup</span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-100 mt-1">금주 선발 라인업</h2>
          </div>
          <div className="bg-[#070b08] border border-green-900/40 rounded-3xl p-6 shadow-2xl relative flex flex-col items-center justify-center min-h-[480px] sm:min-h-[580px] w-full overflow-hidden py-12">
            <div aria-hidden className="absolute inset-4 rounded-2xl border border-emerald-400/15 bg-[linear-gradient(90deg,rgba(16,185,129,0.06)_0_10%,transparent_10%_20%,rgba(16,185,129,0.045)_20%_30%,transparent_30%_40%,rgba(16,185,129,0.05)_40%_50%,transparent_50%_60%,rgba(16,185,129,0.045)_60%_70%,transparent_70%_80%,rgba(16,185,129,0.06)_80%_90%,transparent_90%_100%)]" />
            <div aria-hidden className="absolute left-8 right-8 top-1/2 h-px bg-emerald-300/15" />
            <div aria-hidden className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/15 sm:h-32 sm:w-32" />
            <div aria-hidden className="absolute left-1/2 top-4 h-24 w-40 -translate-x-1/2 rounded-b-2xl border-x border-b border-emerald-300/15 sm:w-56" />
            <div aria-hidden className="absolute bottom-4 left-1/2 h-24 w-40 -translate-x-1/2 rounded-t-2xl border-x border-t border-emerald-300/15 sm:w-56" />
            {lineupDots.map((dot) => (
              <div
                key={dot.spotId}
                style={{
                  position: 'absolute',
                  top: dot.coords.top,
                  left: dot.coords.left,
                  transform: 'translate(-50%, -50%)',
                  transition: 'top 0.35s ease, left 0.35s ease',
                }}
              >
                <PlayerDot
                  number={dot.number}
                  name={dot.name}
                  isGK={dot.isGK}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 👥 4. 선수 명단 구역 */}
      <section id="players" className="bg-gradient-to-b from-[#050505] to-[#0a0a0a] w-full py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-center flex justify-center items-center gap-2 mb-3 text-white">
            선수 명단
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-400 mb-8 font-semibold bg-white/5 py-2 px-6 rounded-full w-fit mx-auto border border-white/5">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> 스트라이커</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> 미드필더</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> 수비수</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> 골키퍼</span>
          </div>

          {players.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-12 bg-[#111] rounded-2xl border border-white/5 max-w-xl mx-auto">선수 명단이 비어있습니다.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {players.map((player) => {
                const posStyle = getPositionStyles(player.position);

                return (
                  <div 
                    key={player.id} 
                    className={`rounded-2xl p-6 sm:p-7 flex flex-col items-center border shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${posStyle.cardClass}`}
                  >
                    <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mb-4 text-3xl bg-black/40 text-white/80 shadow-md">
                      👤
                    </div>
                    <div className="font-black text-lg sm:text-xl mb-3 tracking-wide truncate w-full text-center text-gray-200 transition-colors">
                      {player.name}
                    </div>
                    {player.back_number && (
                      <span className="mb-3 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-black text-white/80">
                        No. {player.back_number}
                      </span>
                    )}
                    <span className={`text-xs px-3.5 py-1 rounded-full font-bold border tracking-wider shadow-inner ${posStyle.badgeClass}`}>
                      {posStyle.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ⚔️ 5. 매치 스코어 보드 구역 */}
      <section id="match" className="bg-[#0a0a0a] w-full py-20 relative">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[300px] h-[300px] bg-[#1a233a]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[300px] h-[300px] bg-[#3b1028]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              최근 경기 결과
            </h2>
            <Link 
              href="/matches" 
              className="text-xs font-black text-[#f2d272] hover:text-white bg-black/30 hover:bg-black/50 border border-gray-700 px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow-md"
            >
              경기 결과 보기
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-gray-700/50 bg-[#1e1e1f] shadow-2xl">
            {matchLoading ? (
              <div className="text-center py-12 text-sm text-gray-400 relative z-10">경기 데이터를 분석 중입니다...</div>
            ) : match ? (
              <div className="relative z-10">
                <div className="flex items-center justify-between px-5 py-4 text-xs font-black text-gray-300 sm:px-7">
                  <span>
                    {match?.is_practice ? '친선 매치' : '공식 매치'} · {displayDate}
                  </span>
                  <span className="text-gray-100">경기 종료</span>
                </div>

                <div className="px-5 pb-2 text-center sm:px-7">
                  <p className="text-xl font-black tracking-[0.14em] text-white sm:text-2xl">
                    {displayMatchTitle}
                  </p>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pb-5 pt-3 sm:px-10 sm:pb-7">
                  <div className="flex min-w-0 flex-col items-center text-center">
                    <div className="mb-3 h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-black/30 sm:h-16 sm:w-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={homeLogoUrl} className="h-full w-full object-cover p-1" alt="Home Team" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }} />
                    </div>
                    <span className="w-full truncate text-sm font-black text-white sm:text-base">{displayHomeTeam}</span>
                  </div>

                  <div className="flex min-w-[120px] flex-col items-center px-3 text-center">
                    <div className="flex items-center gap-5 font-mono">
                      <span className="text-4xl font-black text-white sm:text-5xl">{displayHomeScore}</span>
                      <span className="text-2xl font-black text-gray-400">-</span>
                      <span className="text-4xl font-black text-white sm:text-5xl">{displayAwayScore}</span>
                    </div>
                    <span className={`mt-3 rounded-md border px-2.5 py-1 text-[10px] font-black ${
                      match?.match_result === '패배' ? 'border-red-500/30 bg-red-500/10 text-red-300' :
                      match?.match_result === '무승부' ? 'border-gray-500/30 bg-gray-500/10 text-gray-300' :
                      'border-green-500/30 bg-green-500/10 text-green-300'
                    }`}>
                      {match?.match_result || '경기 결과'}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col items-center text-center">
                    <div className="mb-3 h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-black/30 sm:h-16 sm:w-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={awayLogoUrl} className="h-full w-full object-cover p-1" alt="Away Team" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AWAY_LOGO; }} />
                    </div>
                    <span className="w-full truncate text-sm font-black text-white sm:text-base">{displayAwayTeam}</span>
                  </div>
                </div>

                {recentMatchGoals.length > 0 && (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 bg-black/15 px-5 py-3 text-[11px] font-bold text-gray-300 sm:px-7">
                    <p className="min-w-0 truncate text-left">
                      {homeScorers.length > 0 ? formatGoalList(homeScorers) : ''}
                    </p>
                    <span className="px-4 text-xs text-white/80">⚽</span>
                    <p className="min-w-0 truncate text-right">
                      {awayScorers.length > 0 ? formatGoalList(awayScorers) : ''}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                등록된 경기 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 💖 6. 연락하기 문의 폼 구역 */}
      <section id="contact" className="relative w-full py-24 bg-gradient-to-t from-[#3b1028]/30 via-[#0a0508] to-[#050505]">
        <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-[#3b1028]/20 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-2xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black flex justify-center items-center gap-2 mb-2 text-white">
              CONTACT & JOIN
            </h2>
            <p className="text-gray-400 text-sm">입단 신청 및 구단 관련 문의를 남겨주세요.</p>
          </div>
          <div className="grid grid-cols-2 bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('inquiry')}
              className={`py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === 'inquiry' ? 'bg-[#f2d272] text-black shadow-md font-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              ✉️ 팀 문의
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`py-3 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === 'join' ? 'bg-[#f2d272] text-black shadow-md font-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              👤 팀 참가 신청
            </button>
          </div>

          <form onSubmit={handleSendMessage} className="bg-black/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-gray-800/60 shadow-2xl space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">이름 *</label>
              <input 
                type="text" 
                value={senderName} 
                onChange={(e) => setSenderName(e.target.value.replace(/[0-9]/g, ''))} 
                placeholder="홍길동 (숫자 입력 불가)" 
                className="w-full bg-white/5 border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#ff00ff] focus:bg-white/10 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">이메일 *</label>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={emailId} 
                    onChange={(e) => setEmailId(e.target.value)} 
                    placeholder="이메일 아이디" 
                    className="w-1/2 bg-white/5 border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#ff00ff] focus:bg-white/10 transition-colors" 
                  />
                  <span className="text-gray-500 font-bold">@</span>
                  <select 
                    value={domainSelect} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setDomainSelect(val);
                      if (val !== 'custom') {
                        setEmailDomain(val);
                      } else {
                        setEmailDomain('');
                      }
                    }} 
                    className="w-1/2 bg-white/5 border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#ff00ff] focus:bg-white/10 transition-colors [&>option]:bg-[#111]"
                  >
                    <option value="naver.com">naver.com</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="daum.net">daum.net</option>
                    <option value="hanmail.net">hanmail.net</option>
                    <option value="custom">직접 입력</option>
                  </select>
                </div>
                {domainSelect === 'custom' && (
                  <input 
                    type="text" 
                    value={emailDomain} 
                    onChange={(e) => setEmailDomain(e.target.value)} 
                    placeholder="도메인을 직접 입력하세요. (예: kakao.com)" 
                    className="w-full bg-white/5 border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#ff00ff] transition-all" 
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">연락처 *</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} 
                placeholder="01012345678 (하이픈 제외 숫자만)" 
                className="w-full bg-white/5 border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#ff00ff] focus:bg-white/10 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                {activeTab === 'join' ? '자기소개 및 선호 포지션 *' : '문의 내용 *'}
              </label>
              <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder={activeTab === 'join' ? "선호 포지션, 주요 경력 등 어필할 내용을 작성해주세요." : "문의하실 내용을 작성해주세요."} className="w-full bg-white/5 border border-gray-700 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-[#ff00ff] focus:bg-white/10 transition-colors resize-none"></textarea>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#f2d272] text-black font-black py-4 rounded-xl text-sm hover:bg-white disabled:opacity-50 transition-colors shadow-[0_0_20px_rgba(242,210,114,0.2)] mt-2">
              {isSubmitting ? '전송 처리 중...' : '🛫 구단으로 전송하기'}
            </button>
            <p className="text-[11px] text-gray-500 text-center pt-2">
              전송 버튼을 누르면 구단 관리자 이메일로 즉시 알림이 발송됩니다.
            </p>
          </form>
        </div>
      </section>

      {/* 7. 푸터 구역 */}
      <footer className="bg-[#050505] w-full py-12 border-t border-gray-800/50">
        <div className="max-w-md mx-auto text-center px-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <div className="w-8 h-8 rounded-full bg-white/10 p-0.5 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tem_logo} alt="Footer Club Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_HOME_LOGO; }} />
            </div>
            <span className="font-black text-base tracking-wider">{displayHomeTeam}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">
            열정과 함께, 끝까지 승리를 위하여.
          </p>
          <div className="pt-2">
            <a
              href="https://www.instagram.com/gabby.utd?igsh=YWk4N2FiZGo4Nnht" 
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-xs font-bold px-10 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
            >
              <span>📸 Instagram</span>
            </a>
          </div>
          <p className="text-[11px] text-gray-600 pt-3">
            © 2026 {displayHomeTeam}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
