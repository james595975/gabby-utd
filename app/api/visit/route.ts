import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

function getObservedIp(request: NextRequest) {
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  return (
    vercelForwardedFor?.split(',')[0]?.trim() ||
    realIp?.trim() ||
    null
  );
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is required for visit logging.');
      return new NextResponse(null, { status: 204 });
    }

    const { supabaseUrl } = getSupabaseConfig();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body = await request.json().catch(() => ({}));
    const observedIp = getObservedIp(request);

    const { error } = await supabase
      .from('visitor_logs')
      .insert([
        {
          ip_address: observedIp,
          path: sanitizeText(body.path, 500),
          referrer: sanitizeText(body.referrer, 500),
          user_agent: sanitizeText(body.userAgent, 500),
        },
      ]);

    if (error) {
      console.error('Visit log insert error:', error);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Visit log error:', error);
    return new NextResponse(null, { status: 204 });
  }
}
