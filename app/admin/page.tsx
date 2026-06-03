import Link from 'next/link';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white px-4 py-10">
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-gray-800 pb-4">
          <p className="text-xs text-[#f2d272] font-black tracking-[0.3em] uppercase">Gabby UTD Admin</p>
          <h1 className="text-2xl font-black mt-2">관리자 대시보드</h1>
          <p className="text-sm text-gray-500 mt-2">Supabase Auth 세션과 admin_users.uid 확인을 통과한 계정만 접근할 수 있습니다.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/lineup"
            className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-5 hover:border-[#f2d272]/60 transition-colors"
          >
            <span className="text-xs text-gray-500 font-bold">LINEUP</span>
            <h2 className="text-lg font-black mt-2">선발 라인업 관리</h2>
            <p className="text-xs text-gray-500 mt-2">포메이션과 선수 배치를 수정합니다.</p>
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-5 hover:border-[#f2d272]/60 transition-colors"
          >
            <span className="text-xs text-gray-500 font-bold">HOME</span>
            <h2 className="text-lg font-black mt-2">홈 화면 보기</h2>
            <p className="text-xs text-gray-500 mt-2">공개 페이지로 돌아갑니다.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
