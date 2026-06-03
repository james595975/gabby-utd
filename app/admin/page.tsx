'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
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

      setIsAuthenticated(true);
    };

    checkAdmin();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="bg-[#050505] min-h-screen flex items-center justify-center text-white">
        <p className="text-sm text-gray-400">관리자 권한 확인 중...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 기존 관리자 UI를 여기에 렌더링 */}
      <h1>관리자 페이지</h1>
    </div>
  );
}