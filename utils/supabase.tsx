'use client';

import { createClient } from '@supabase/supabase-js';

// ❌ 기존 잘못된 예시: 'https://bdsatcdfwqgrlbqvikte.supabase.co/rest/v1'
// ⭕ 올바른 예시: 딱 .co 까지만 주소를 적어줍니다.
const supabaseUrl = 'https://bdsatcdfwqgrlbqvikte.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2F0Y2Rmd3FncmxicXZpa3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNTY3NDUsImV4cCI6MjA5NTYzMjc0NX0.wjiA9JeeW5vyeUAxsyYLIUiSe5yLrgYHmqXkP5ORzJw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);