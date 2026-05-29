import { createClient } from '@supabase/supabase-js';

// .env.local에 저장된 환경변수를 불러와 Supabase 클라이언트를 초기화합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);