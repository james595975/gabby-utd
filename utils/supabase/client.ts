import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'https://bdsatcdfwqgrlbqvikte.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2F0Y2Rmd3FncmxicXZpa3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTY3NDUsImV4cCI6MjA5NTYzMjc0NX0.wjiA9JeeW5vyeUAxsyYLIUiSe5yLrgYHmqXkP5ORzJw';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
