'use client';

import { useEffect } from 'react';

export default function CopyProtectionClient() {
  useEffect(() => {
    // 1. 마우스 우클릭 메뉴 메뉴 팝업 차단
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. 키보드 제어를 통한 복사 단축키(Ctrl+C / Cmd+C) 및 개발자 도구 진입 우회 차단
    const handleKeyDown = (e: KeyboardEvent) => {
      // 복사 조합키 차단
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
      }

      // 개발자 도구 단축키 차단 (F12, Ctrl+Shift+I, Cmd+Opt+I)
      if (
        e.key === 'F12' || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i')
      ) {
        e.preventDefault();
      }
    };

    // 이벤트 리스너 글로벌 등록
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // 가비지 컬렉션 (안전한 이벤트 해제)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null; // UI를 렌더링하지 않는 기능성 컴포넌트
}
