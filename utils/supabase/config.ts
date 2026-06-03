const FALLBACK_SUPABASE_URL = 'https://bdsatcdfwqgrlbqvikte.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2F0Y2Rmd3FncmxicXZpa3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTY3NDUsImV4cCI6MjA5NTYzMjc0NX0.wjiA9JeeW5vyeUAxsyYLIUiSe5yLrgYHmqXkP5ORzJw';

function isValidSupabaseUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function isLikelyJwt(value?: string) {
  return !!value && /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

export function getSupabaseConfig() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    supabaseUrl: isValidSupabaseUrl(envUrl) ? envUrl as string : FALLBACK_SUPABASE_URL,
    supabaseAnonKey: isLikelyJwt(envAnonKey) ? envAnonKey as string : FALLBACK_SUPABASE_ANON_KEY,
  };
}
