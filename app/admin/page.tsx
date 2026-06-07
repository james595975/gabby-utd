'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Tab = 'matches' | 'schedules' | 'news' | 'players' | 'messages';

interface MatchItem {
  id: number;
  home_team?: string;
  away_team?: string;
  home_score: number;
  away_score: number;
  home_logo?: string | null;
  away_logo?: string | null;
  date?: string;
  is_practice?: boolean;
  match_result?: string;
  round_number?: number | null;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url?: string | null;
  link_url?: string | null;
  tag?: string;
  created_at?: string;
}

interface GoalItem {
  id: number;
  match_id: number;
  scorer_name: string;
  minute?: number | null;
  team: 'home' | 'away';
  note?: string | null;
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
  created_at?: string;
}

interface PlayerItem {
  id: number;
  name: string;
  position: string;
  back_number?: number | null;
  lineup_spot?: number | null;
}

interface MessageItem {
  id: number;
  type: string;
  name: string;
  content: string;
  created_at?: string;
}

interface AdminData {
  matches: MatchItem[];
  match_goals: GoalItem[];
  schedules: ScheduleItem[];
  news: NewsItem[];
  players: PlayerItem[];
  messages: MessageItem[];
}

const emptyData: AdminData = {
  matches: [],
  match_goals: [],
  schedules: [],
  news: [],
  players: [],
  messages: [],
};

const tabs: { id: Tab; label: string; hint: string }[] = [
  { id: 'matches', label: '경기 관리', hint: '결과 등록, 수정, 삭제' },
  { id: 'schedules', label: '일정 관리', hint: '예정 경기 등록' },
  { id: 'news', label: '뉴스 관리', hint: '공지와 소식 관리' },
  { id: 'players', label: '선수단 관리', hint: '선수 정보와 등번호' },
  { id: 'messages', label: '받은 문의', hint: '문의/입단 신청 확인' },
];

const newsTagOptions = ['공지', '경기결과', '이벤트', '소식'];

const today = () => new Date().toISOString().slice(0, 10);

const defaultMatch = {
  home_team: 'Gabby UTD',
  away_team: '',
  home_score: 0,
  away_score: 0,
  home_logo: '',
  away_logo: '',
  is_practice: false,
  match_result: '승리',
  date: today(),
  round_number: '',
};

const defaultNews = {
  title: '',
  content: '',
  image_url: '',
  link_url: '',
  tag: '공지',
};

const defaultSchedule = {
  opponent: '',
  opponent_logo: '',
  match_date: today(),
  match_time: '',
  location: '',
  match_type: '공식전',
  note: '',
};

const defaultGoal = {
  match_id: '',
  scorer_name: '',
  minute: '',
  team: 'home',
  note: '',
};

const defaultPlayer = {
  name: '',
  position: '미드필더',
  back_number: '',
  lineup_spot: '',
};

const DEFAULT_AWAY_LOGO = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg';

function cleanLogoUrl(value?: string | null) {
  const url = String(value || '').replace(/\s+/g, '').trim();
  return url.startsWith('http') ? url : DEFAULT_AWAY_LOGO;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [data, setData] = useState<AdminData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ resource: Tab; id: number } | null>(null);
  const [matchForm, setMatchForm] = useState<Record<string, string | number | boolean | null>>(defaultMatch);
  const [goalForm, setGoalForm] = useState<Record<string, string | number | null>>(defaultGoal);
  const [scheduleForm, setScheduleForm] = useState<Record<string, string | null>>(defaultSchedule);
  const [newsForm, setNewsForm] = useState<Record<string, string | null>>(defaultNews);
  const [playerForm, setPlayerForm] = useState<Record<string, string | number | null>>(defaultPlayer);

  const counts = useMemo(() => ({
    matches: data.matches.length,
    schedules: data.schedules.length,
    news: data.news.length,
    players: data.players.length,
    messages: data.messages.length,
  }), [data]);

  async function requestAdmin(method: string, body?: Record<string, unknown>) {
    const response = await fetch('/api/admin/manage', {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || '관리 요청 처리에 실패했습니다.');
    }
    return result;
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await requestAdmin('GET');
      setData(result.data as AdminData);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '관리 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  function resetForms() {
    setEditing(null);
    setMatchForm({ ...defaultMatch, date: today() });
    setGoalForm({ ...defaultGoal, match_id: data.matches[0]?.id || '' });
    setScheduleForm({ ...defaultSchedule, match_date: today() });
    setNewsForm(defaultNews);
    setPlayerForm(defaultPlayer);
  }

  async function saveResource(resource: Exclude<Tab, 'messages'>) {
    setSaving(true);
    try {
      const form = resource === 'matches' ? matchForm : resource === 'schedules' ? scheduleForm : resource === 'news' ? newsForm : playerForm;
      const method = editing?.resource === resource ? 'PATCH' : 'POST';
      await requestAdmin(method, {
        resource,
        id: editing?.resource === resource ? editing.id : undefined,
        data: form,
      });
      resetForms();
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function saveGoal() {
    if (!goalForm.match_id || !goalForm.scorer_name) {
      alert('경기와 득점자를 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      await requestAdmin('POST', {
        resource: 'match_goals',
        data: goalForm,
      });
      setGoalForm({ ...defaultGoal, match_id: goalForm.match_id });
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '득점 기록 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteResource(resource: Tab | 'match_goals', id: number, label: string) {
    if (!confirm(`${label} 항목을 삭제할까요?`)) return;
    setSaving(true);
    try {
      await requestAdmin('DELETE', { resource, id });
      await loadData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '삭제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function editMatch(item: MatchItem) {
    setActiveTab('matches');
    setEditing({ resource: 'matches', id: item.id });
    setMatchForm({
      home_team: item.home_team || '',
      away_team: item.away_team || '',
      home_score: item.home_score ?? 0,
      away_score: item.away_score ?? 0,
      home_logo: item.home_logo || '',
      away_logo: item.away_logo || '',
      is_practice: Boolean(item.is_practice),
      match_result: item.match_result || '무승부',
      date: item.date || today(),
      round_number: item.round_number ?? '',
    });
  }

  function editSchedule(item: ScheduleItem) {
    setActiveTab('schedules');
    setEditing({ resource: 'schedules', id: item.id });
    setScheduleForm({
      opponent: item.opponent || '',
      opponent_logo: item.opponent_logo || item.away_logo || '',
      match_date: item.match_date || today(),
      match_time: item.match_time || '',
      location: item.location || '',
      match_type: item.match_type || '공식전',
      note: item.note || '',
    });
  }

  function editNews(item: NewsItem) {
    setActiveTab('news');
    setEditing({ resource: 'news', id: item.id });
    setNewsForm({
      title: item.title || '',
      content: item.content || '',
      image_url: item.image_url || '',
      link_url: item.link_url || '',
      tag: item.tag || '공지',
    });
  }

  function editPlayer(item: PlayerItem) {
    setActiveTab('players');
    setEditing({ resource: 'players', id: item.id });
    setPlayerForm({
      name: item.name || '',
      position: item.position || '미드필더',
      back_number: item.back_number ?? '',
      lineup_spot: item.lineup_spot ?? '',
    });
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white px-4 py-6 sm:py-10">
      <section className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] text-[#f2d272] font-black tracking-[0.28em] uppercase">Gabby UTD Admin</p>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">관리자 센터</h1>
            <p className="text-sm text-gray-500 mt-2">경기, 뉴스, 선수단, 문의를 한 화면에서 관리합니다.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/lineup" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-gray-300 hover:border-[#f2d272]/60 hover:text-white transition-colors">
              라인업
            </Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-gray-300 hover:border-[#f2d272]/60 hover:text-white transition-colors">
              홈 화면
            </Link>
          </div>
        </header>

        <nav className="grid gap-2 sm:grid-cols-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${activeTab === tab.id ? 'border-[#f2d272]/70 bg-[#f2d272] text-black shadow-[0_0_24px_rgba(242,210,114,0.16)]' : 'border-white/10 bg-white/[0.035] text-gray-300 hover:border-white/25 hover:bg-white/[0.06]'}`}
            >
              <span className="text-sm font-black">{tab.label}</span>
              <span className={`ml-2 text-xs font-mono ${activeTab === tab.id ? 'text-black/60' : 'text-[#f2d272]'}`}>{counts[tab.id]}</span>
              <p className={`mt-1 text-[11px] ${activeTab === tab.id ? 'text-black/60' : 'text-gray-500'}`}>{tab.hint}</p>
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center text-sm text-gray-400">관리 데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
            {activeTab === 'matches' && (
              <>
                <div className="space-y-5">
                <Panel title={editing?.resource === 'matches' ? '경기 수정' : '경기 등록'}>
                  <Field label="홈 팀"><Input value={matchForm.home_team} onChange={(v) => setMatchForm({ ...matchForm, home_team: v })} /></Field>
                  <Field label="원정 팀"><Input value={matchForm.away_team} onChange={(v) => setMatchForm({ ...matchForm, away_team: v })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="홈 점수"><Input type="number" value={matchForm.home_score} onChange={(v) => setMatchForm({ ...matchForm, home_score: Number(v) })} /></Field>
                    <Field label="원정 점수"><Input type="number" value={matchForm.away_score} onChange={(v) => setMatchForm({ ...matchForm, away_score: Number(v) })} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="날짜"><Input type="date" value={matchForm.date} onChange={(v) => setMatchForm({ ...matchForm, date: v })} /></Field>
                    <Field label="DFL 라운드"><Input type="number" value={matchForm.round_number} onChange={(v) => setMatchForm({ ...matchForm, round_number: v === '' ? '' : Number(v) })} /></Field>
                  </div>
                  <Field label="결과">
                    <select value={String(matchForm.match_result)} onChange={(e) => setMatchForm({ ...matchForm, match_result: e.target.value })} className={selectClass}>
                      <option>승리</option><option>무승부</option><option>패배</option>
                    </select>
                  </Field>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <input type="checkbox" checked={Boolean(matchForm.is_practice)} onChange={(e) => setMatchForm({ ...matchForm, is_practice: e.target.checked })} className="accent-[#f2d272]" />
                    친선/연습 경기
                  </label>
                  <ActionButtons saving={saving} editing={editing?.resource === 'matches'} onCancel={resetForms} onSave={() => saveResource('matches')} />
                </Panel>
                <Panel title="득점 기록 등록">
                  <Field label="경기 선택">
                    <select value={String(goalForm.match_id)} onChange={(e) => setGoalForm({ ...goalForm, match_id: e.target.value })} className={selectClass}>
                      <option value="">경기 선택</option>
                      {data.matches.map((match) => (
                        <option key={match.id} value={match.id}>
                          {match.date || '-'} · {match.home_team || 'Gabby UTD'} vs {match.away_team || '상대 팀'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="득점자"><Input value={goalForm.scorer_name} onChange={(v) => setGoalForm({ ...goalForm, scorer_name: v })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="득점 시간(분)"><Input type="number" value={goalForm.minute} onChange={(v) => setGoalForm({ ...goalForm, minute: v })} /></Field>
                    <Field label="팀">
                      <select value={String(goalForm.team)} onChange={(e) => setGoalForm({ ...goalForm, team: e.target.value })} className={selectClass}>
                        <option value="home">Gabby UTD</option>
                        <option value="away">상대팀</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="메모"><Input value={goalForm.note} onChange={(v) => setGoalForm({ ...goalForm, note: v })} /></Field>
                  <button type="button" disabled={saving} onClick={saveGoal} className="w-full rounded-xl bg-[#f2d272] px-4 py-3 text-sm font-black text-black hover:bg-white disabled:opacity-50 transition-colors">
                    {saving ? '저장 중...' : '득점 기록 추가'}
                  </button>
                </Panel>
                </div>
                <Panel title="경기 목록" wide>
                  <div className="space-y-3">
                    {data.matches.map((match) => {
                      const goals = data.match_goals.filter((goal) => goal.match_id === match.id);
                      return (
                      <Row key={match.id}>
                        <div>
                          <p className="text-sm font-black">{match.home_team || 'Gabby UTD'} {match.home_score} : {match.away_score} {match.away_team || '상대 팀'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {match.date || '-'} · {match.match_result || '무승부'} · {match.is_practice ? '친선전' : `DFL ${match.round_number || match.id}ROUND`}
                          </p>
                          {goals.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {goals.map((goal) => (
                                <span key={goal.id} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-gray-300">
                                  {goal.minute ? `${goal.minute}' ` : ''}{goal.scorer_name}{goal.team === 'away' ? ' · 상대' : ''}
                                  <button onClick={() => deleteResource('match_goals', goal.id, '득점 기록')} className="ml-2 text-red-300 hover:text-red-200">삭제</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <RowActions onEdit={() => editMatch(match)} onDelete={() => deleteResource('matches', match.id, '경기')} />
                      </Row>
                      );
                    })}
                  </div>
                </Panel>
              </>
            )}

            {activeTab === 'schedules' && (
              <>
                <Panel title={editing?.resource === 'schedules' ? '일정 수정' : '일정 등록'}>
                  <Field label="상대 팀"><Input value={scheduleForm.opponent} onChange={(v) => setScheduleForm({ ...scheduleForm, opponent: v })} /></Field>
                  <Field label="상대팀 로고 URL"><Input value={scheduleForm.opponent_logo} onChange={(v) => setScheduleForm({ ...scheduleForm, opponent_logo: v })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="경기 날짜"><Input type="date" value={scheduleForm.match_date} onChange={(v) => setScheduleForm({ ...scheduleForm, match_date: v })} /></Field>
                    <Field label="경기 시간"><Input type="time" value={scheduleForm.match_time} onChange={(v) => setScheduleForm({ ...scheduleForm, match_time: v })} /></Field>
                  </div>
                  <Field label="장소"><Input value={scheduleForm.location} onChange={(v) => setScheduleForm({ ...scheduleForm, location: v })} /></Field>
                  <Field label="경기 종류">
                    <select value={String(scheduleForm.match_type)} onChange={(e) => setScheduleForm({ ...scheduleForm, match_type: e.target.value })} className={selectClass}>
                      <option>공식전</option><option>친선전</option><option>연습경기</option>
                    </select>
                  </Field>
                  <Field label="메모"><Textarea value={scheduleForm.note} onChange={(v) => setScheduleForm({ ...scheduleForm, note: v })} /></Field>
                  <ActionButtons saving={saving} editing={editing?.resource === 'schedules'} onCancel={resetForms} onSave={() => saveResource('schedules')} />
                </Panel>
                <Panel title="일정 목록" wide>
                  <div className="space-y-3">
                    {data.schedules.map((schedule) => (
                      <Row key={schedule.id}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/40 text-xs font-black text-gray-500">
                            {schedule.opponent_logo || schedule.away_logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cleanLogoUrl(schedule.opponent_logo || schedule.away_logo)}
                                alt={schedule.opponent}
                                className="h-full w-full object-cover p-0.5"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = DEFAULT_AWAY_LOGO;
                                }}
                              />
                            ) : 'VS'}
                          </div>
                          <div className="min-w-0">
                          <p className="text-sm font-black">Gabby UTD vs {schedule.opponent || '상대 팀'}</p>
                          <p className="text-xs text-gray-500 mt-1">{schedule.match_date || '-'} {schedule.match_time ? `· ${schedule.match_time.slice(0, 5)}` : ''} · {schedule.match_type || '공식전'} · {schedule.location || '장소 미정'}</p>
                          {schedule.note && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{schedule.note}</p>}
                          </div>
                        </div>
                        <RowActions onEdit={() => editSchedule(schedule)} onDelete={() => deleteResource('schedules', schedule.id, '일정')} />
                      </Row>
                    ))}
                  </div>
                </Panel>
              </>
            )}

            {activeTab === 'news' && (
              <>
                <Panel title={editing?.resource === 'news' ? '뉴스 수정' : '뉴스 등록'}>
                  <Field label="제목"><Input value={newsForm.title} onChange={(v) => setNewsForm({ ...newsForm, title: v })} /></Field>
                  <Field label="태그">
                    <select value={String(newsForm.tag || '공지')} onChange={(e) => setNewsForm({ ...newsForm, tag: e.target.value })} className={selectClass}>
                      {newsTagOptions.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="이미지 URL"><Input value={newsForm.image_url} onChange={(v) => setNewsForm({ ...newsForm, image_url: v })} /></Field>
                  <Field label="링크 URL"><Input value={newsForm.link_url} onChange={(v) => setNewsForm({ ...newsForm, link_url: v })} /></Field>
                  <Field label="내용"><Textarea value={newsForm.content} onChange={(v) => setNewsForm({ ...newsForm, content: v })} /></Field>
                  <ActionButtons saving={saving} editing={editing?.resource === 'news'} onCancel={resetForms} onSave={() => saveResource('news')} />
                </Panel>
                <Panel title="뉴스 목록" wide>
                  <div className="space-y-3">
                    {data.news.map((item) => (
                      <Row key={item.id}>
                        <div>
                          <p className="text-sm font-black">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.tag || '공지'} · {item.created_at?.slice(0, 10) || '-'}</p>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.content}</p>
                        </div>
                        <RowActions onEdit={() => editNews(item)} onDelete={() => deleteResource('news', item.id, '뉴스')} />
                      </Row>
                    ))}
                  </div>
                </Panel>
              </>
            )}

            {activeTab === 'players' && (
              <>
                <Panel title={editing?.resource === 'players' ? '선수 수정' : '선수 등록'}>
                  <Field label="이름"><Input value={playerForm.name} onChange={(v) => setPlayerForm({ ...playerForm, name: v })} /></Field>
                  <Field label="포지션"><Input value={playerForm.position} onChange={(v) => setPlayerForm({ ...playerForm, position: v })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="등번호"><Input type="number" value={playerForm.back_number} onChange={(v) => setPlayerForm({ ...playerForm, back_number: v })} /></Field>
                    <Field label="라인업 자리"><Input type="number" value={playerForm.lineup_spot} onChange={(v) => setPlayerForm({ ...playerForm, lineup_spot: v })} /></Field>
                  </div>
                  <ActionButtons saving={saving} editing={editing?.resource === 'players'} onCancel={resetForms} onSave={() => saveResource('players')} />
                </Panel>
                <Panel title="선수 목록" wide>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {data.players.map((player) => (
                      <Row key={player.id}>
                        <div>
                          <p className="text-sm font-black">{player.back_number ? `No.${player.back_number} ` : ''}{player.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{player.position} · 자리 {player.lineup_spot || '대기'}</p>
                        </div>
                        <RowActions onEdit={() => editPlayer(player)} onDelete={() => deleteResource('players', player.id, '선수')} />
                      </Row>
                    ))}
                  </div>
                </Panel>
              </>
            )}

            {activeTab === 'messages' && (
              <Panel title="받은 문의" wide>
                <div className="space-y-3">
                  {data.messages.map((message) => (
                    <Row key={message.id}>
                      <div className="min-w-0">
                        <p className="text-sm font-black">{message.type === 'join' ? '입단 신청' : '팀 문의'} · {message.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{message.created_at?.slice(0, 16).replace('T', ' ') || '-'}</p>
                        <p className="text-xs text-gray-300 mt-3 whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <button onClick={() => deleteResource('messages', message.id, '문의')} className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10 transition-colors">
                        삭제
                      </button>
                    </Row>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#f2d272]/70';
const selectClass = inputClass;

function Panel({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`rounded-3xl border border-white/10 bg-[#0a0a0a]/95 p-5 shadow-2xl ${wide ? 'lg:col-span-1' : ''}`}>
      <h2 className="text-base font-black text-white mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = 'text' }: { value: unknown; onChange: (value: string) => void; type?: string }) {
  return <input type={type} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
}

function Textarea({ value, onChange }: { value: unknown; onChange: (value: string) => void }) {
  return <textarea rows={6} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-none`} />;
}

function ActionButtons({ saving, editing, onSave, onCancel }: { saving: boolean; editing: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-2">
      <button type="button" disabled={saving} onClick={onSave} className="flex-1 rounded-xl bg-[#f2d272] px-4 py-3 text-sm font-black text-black hover:bg-white disabled:opacity-50 transition-colors">
        {saving ? '저장 중...' : editing ? '수정 저장' : '등록'}
      </button>
      {editing && (
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-300 hover:bg-white/5 transition-colors">
          취소
        </button>
      )}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <article className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">{children}</article>;
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 gap-2">
      <button onClick={onEdit} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-white/5 transition-colors">수정</button>
      <button onClick={onDelete} className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/10 transition-colors">삭제</button>
    </div>
  );
}
