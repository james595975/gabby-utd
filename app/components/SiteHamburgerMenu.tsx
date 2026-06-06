'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type ActivePage = 'home' | 'schedule' | 'news' | 'matches';

interface SiteHamburgerMenuProps {
  active?: ActivePage;
}

const MENU_ITEMS: Array<{ href: string; label: string; key: ActivePage }> = [
  { href: '/', label: '홈', key: 'home' },
  { href: '/schedule', label: '전체 경기 일정', key: 'schedule' },
  { href: '/news', label: '뉴스', key: 'news' },
  { href: '/matches', label: '경기 결과', key: 'matches' },
];

export default function SiteHamburgerMenu({ active }: SiteHamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="메뉴 열기"
        aria-expanded={isOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-200 transition-colors hover:border-[#f2d272]/50 hover:bg-white/[0.08] hover:text-white"
      >
        <span className="flex flex-col gap-1">
          <span className="block h-0.5 w-4 rounded-full bg-current"></span>
          <span className="block h-0.5 w-4 rounded-full bg-current"></span>
          <span className="block h-0.5 w-4 rounded-full bg-current"></span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#070707]/95 p-1.5 text-xs font-black text-gray-300 shadow-2xl backdrop-blur-xl">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`block rounded-xl px-3.5 py-3 transition-colors hover:bg-white/10 hover:text-white ${
                active === item.key ? 'text-[#f2d272]' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
