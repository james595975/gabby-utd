'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.replace('/admin/login');
          return;
        }

        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (adminError || !adminUser) {
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('관리자 인증 확인 중 오류:', err);
        router.replace('/admin/login');
      }
    };

    checkAdmin();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="bg-[#050505] min-h-screen flex items-center justify-center text-white px-4 relative overflow-hidden">
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-[#1a233a]/20 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#3b1028]/20 rounded-full blur-[120px] pointer-events-none z-0" />
        <p className="text-sm text-gray-400 relative z-10">관리자 인증중...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>관리자 대시보드</h1>
    </div>
  );
}