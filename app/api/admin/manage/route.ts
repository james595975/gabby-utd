import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

const ADMIN_UID = process.env.ADMIN_USER_UID || 'c348daeb-51f9-4347-a3b9-6470085ef190';
const RESOURCES = ['matches', 'match_goals', 'schedules', 'news', 'players', 'messages'] as const;

type Resource = (typeof RESOURCES)[number];

function isResource(value: unknown): value is Resource {
  return typeof value === 'string' && RESOURCES.includes(value as Resource);
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function cleanUrl(value: unknown) {
  return String(value || '').replace(/\s+/g, '').trim() || null;
}

async function getAdminContext(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const sessionClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // This route only verifies the current session.
      },
    },
  });

  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user || user.id !== ADMIN_UID) {
    return { ok: false as const, message: '관리자 권한이 필요합니다.' };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { ok: false as const, message: 'SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.' };
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: adminUser, error: adminError } = await adminClient
    .from('admin_users')
    .select('uid,user_id')
    .or(`uid.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle();

  if (adminError || !adminUser) {
    return { ok: false as const, message: '관리자 목록에 등록된 계정이 아닙니다.' };
  }

  return { ok: true as const, supabase: adminClient };
}

function sanitizeResourcePayload(resource: Resource, payload: Record<string, unknown>) {
  if (resource === 'matches') {
    return {
      home_team: String(payload.home_team || '').trim(),
      away_team: String(payload.away_team || '').trim(),
      home_score: Number(payload.home_score || 0),
      away_score: Number(payload.away_score || 0),
      home_logo: String(payload.home_logo || '').trim() || null,
      away_logo: String(payload.away_logo || '').trim() || null,
      is_practice: Boolean(payload.is_practice),
      match_result: String(payload.match_result || '무승부'),
      date: String(payload.date || '').trim() || new Date().toISOString().slice(0, 10),
      round_number: payload.round_number === '' || payload.round_number == null ? null : Number(payload.round_number),
    };
  }

  if (resource === 'news') {
    return {
      title: String(payload.title || '').trim(),
      content: String(payload.content || '').trim(),
      image_url: String(payload.image_url || '').trim() || null,
      link_url: String(payload.link_url || '').trim() || null,
      tag: String(payload.tag || '공지').trim(),
    };
  }

  if (resource === 'schedules') {
    return {
      opponent: String(payload.opponent || '').trim(),
      opponent_logo: cleanUrl(payload.opponent_logo),
      match_date: String(payload.match_date || '').trim() || new Date().toISOString().slice(0, 10),
      match_time: String(payload.match_time || '').trim() || null,
      location: String(payload.location || '').trim() || null,
      match_type: String(payload.match_type || '공식전').trim(),
      note: String(payload.note || '').trim() || null,
    };
  }

  if (resource === 'match_goals') {
    return {
      match_id: Number(payload.match_id),
      scorer_name: String(payload.scorer_name || '').trim(),
      minute: payload.minute === '' || payload.minute == null ? null : Number(payload.minute),
      team: String(payload.team || 'home').trim() === 'away' ? 'away' : 'home',
      note: String(payload.note || '').trim() || null,
    };
  }

  if (resource === 'players') {
    return {
      name: String(payload.name || '').trim(),
      position: String(payload.position || '').trim(),
      back_number: payload.back_number === '' || payload.back_number == null ? null : Number(payload.back_number),
      lineup_spot: payload.lineup_spot === '' || payload.lineup_spot == null ? null : Number(payload.lineup_spot),
    };
  }

  return {};
}

export async function GET(request: NextRequest) {
  const context = await getAdminContext(request);
  if (!context.ok) return json(401, { success: false, message: context.message });

  const [matches, matchGoals, schedules, news, players, messages] = await Promise.all([
    context.supabase
      .from('matches')
      .select('id,home_team,away_team,home_score,away_score,home_logo,away_logo,date,is_practice,match_result,round_number')
      .order('id', { ascending: false }),
    context.supabase
      .from('match_goals')
      .select('id,match_id,scorer_name,minute,team,note')
      .order('minute', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true }),
    context.supabase
      .from('schedules')
      .select('id,opponent,opponent_logo,away_logo,match_date,match_time,location,match_type,note,created_at')
      .order('match_date', { ascending: true }),
    context.supabase
      .from('news')
      .select('id,title,content,image_url,link_url,tag,created_at')
      .order('id', { ascending: false }),
    context.supabase
      .from('players')
      .select('id,name,position,back_number,lineup_spot')
      .order('back_number', { ascending: true, nullsFirst: false }),
    context.supabase
      .from('messages')
      .select('id,type,name,content,created_at')
      .order('id', { ascending: false }),
  ]);

  const error = matches.error || schedules.error || news.error || players.error || messages.error;
  if (error) return json(500, { success: false, message: error.message });

  return json(200, {
    success: true,
    data: {
      matches: matches.data || [],
      match_goals: matchGoals.error ? [] : matchGoals.data || [],
      schedules: schedules.data || [],
      news: news.data || [],
      players: players.data || [],
      messages: messages.data || [],
    },
  });
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext(request);
  if (!context.ok) return json(401, { success: false, message: context.message });

  const body = await request.json();
  if (!isResource(body.resource) || body.resource === 'messages') {
    return json(400, { success: false, message: '지원하지 않는 등록 요청입니다.' });
  }

  const payload = sanitizeResourcePayload(body.resource, body.data || {});
  const { error } = await context.supabase.from(body.resource).insert([payload]);

  if (error) return json(500, { success: false, message: error.message });
  return json(200, { success: true });
}

export async function PATCH(request: NextRequest) {
  const context = await getAdminContext(request);
  if (!context.ok) return json(401, { success: false, message: context.message });

  const body = await request.json();
  const id = Number(body.id);
  if (!isResource(body.resource) || body.resource === 'messages' || !Number.isInteger(id)) {
    return json(400, { success: false, message: '지원하지 않는 수정 요청입니다.' });
  }

  const payload = sanitizeResourcePayload(body.resource, body.data || {});
  const { error } = await context.supabase.from(body.resource).update(payload).eq('id', id);

  if (error) return json(500, { success: false, message: error.message });
  return json(200, { success: true });
}

export async function DELETE(request: NextRequest) {
  const context = await getAdminContext(request);
  if (!context.ok) return json(401, { success: false, message: context.message });

  const body = await request.json();
  const id = Number(body.id);
  if (!isResource(body.resource) || !Number.isInteger(id)) {
    return json(400, { success: false, message: '지원하지 않는 삭제 요청입니다.' });
  }

  const { error } = await context.supabase.from(body.resource).delete().eq('id', id);

  if (error) return json(500, { success: false, message: error.message });
  return json(200, { success: true });
}
