import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

const ADMIN_UID = process.env.ADMIN_USER_UID || 'c348daeb-51f9-4347-a3b9-6470085ef190';

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
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

export async function POST(request: NextRequest) {
  const context = await getAdminContext(request);
  if (!context.ok) return json(401, { success: false, message: context.message });

  const body = await request.json();
  const formation = String(body.formation || '').trim() || '4-3-3';
  const lineup = body.lineup && typeof body.lineup === 'object'
    ? (body.lineup as Record<string, unknown>)
    : {};

  const assignments = Object.entries(lineup)
    .map(([spotId, playerId]) => ({
      spotId: Number(spotId),
      playerId: Number(playerId),
    }))
    .filter(({ spotId, playerId }) => Number.isInteger(spotId) && Number.isInteger(playerId));

  const selectedPlayerIds = assignments.map((item) => item.playerId);
  if (selectedPlayerIds.length !== new Set(selectedPlayerIds).size) {
    return json(400, { success: false, message: '한 명의 선수를 여러 포지션에 중복 배치할 수 없습니다.' });
  }

  const { error: formationError } = await context.supabase
    .from('formations')
    .upsert({ id: 1, current_formation: formation, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (formationError) return json(500, { success: false, message: formationError.message });

  const { error: resetError } = await context.supabase
    .from('players')
    .update({ lineup_spot: null })
    .not('lineup_spot', 'is', null);

  if (resetError) return json(500, { success: false, message: resetError.message });

  for (const assignment of assignments) {
    const { error } = await context.supabase
      .from('players')
      .update({ lineup_spot: assignment.spotId })
      .eq('id', assignment.playerId);

    if (error) return json(500, { success: false, message: error.message });
  }

  return json(200, { success: true });
}
