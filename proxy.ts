import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/utils/supabase/config';

const ADMIN_UID = process.env.ADMIN_USER_UID || 'c348daeb-51f9-4347-a3b9-6470085ef190';

async function isAdminUser(userId: string, supabaseUrl: string, supabaseAnonKey: string, accessToken?: string) {
  if (userId !== ADMIN_UID) return false;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken && !serviceRoleKey
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

  const uidLookup = await supabase
    .from('admin_users')
    .select('uid')
    .eq('uid', userId)
    .maybeSingle();

  if (!uidLookup.error && uidLookup.data) return true;

  const userIdLookup = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!userIdLookup.error && userIdLookup.data) return true;

  const uppercaseUidLookup = await supabase
    .from('admin_users')
    .select('"UID"')
    .eq('UID', userId)
    .maybeSingle();

  return !uppercaseUidLookup.error && !!uppercaseUidLookup.data;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
    const isAdmin = !error && user && await isAdminUser(user.id, supabaseUrl, supabaseAnonKey, accessToken);

    if (!isAdmin) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Admin proxy auth error:', error);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
