'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);

  return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center text-white px-4 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#1a233a]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#3b1028]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <p className="text-sm text-gray-400 relative z-10">관리자 로그인 페이지로 이동 중...</p>
    </div>
  );
}
