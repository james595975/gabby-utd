'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError || !loginData.user) {
        console.error('Supabase login failed:', loginError);
        alert('로그인 정보가 올바르지 않습니다.');
        return;
      }

      const nextPath = new URLSearchParams(window.location.search).get('next');
      router.replace(nextPath?.startsWith('/admin') ? nextPath : '/admin');
      router.refresh();
    } catch (error) {
      console.error('Admin login error:', error);
      alert('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
      <section className="w-full max-w-md bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs text-[#f2d272] font-black tracking-[0.3em] uppercase">Gabby UTD</p>
          <h1 className="text-2xl font-black">관리자 로그인</h1>
          <p className="text-xs text-gray-500">Supabase Auth 계정 중 admin_users.uid에 등록된 계정만 접근할 수 있습니다.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#f2d272]"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#f2d272]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#f2d272] text-black font-black py-3 rounded-xl text-sm hover:bg-[#e0be5a] disabled:opacity-50 transition-all"
          >
            {isSubmitting ? '확인 중...' : '로그인'}
          </button>
        </form>

        <Link href="/" className="block text-center text-xs text-gray-500 hover:text-[#f2d272] transition-colors">
          홈으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
