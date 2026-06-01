import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import CopyProtectionClient from "./components/CopyProtectionClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gabby UTD",
  description: "Gabby UTD는 축구를 사랑하는 사람들을 위한 커뮤니티입니다. 선수 등록, 문의 사항 전송 등 다양한 기능을 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased select-none`}
    >
      {/* 화면 전체를 flex 세로 배열로 설정 */}
      <body className="min-h-full flex flex-col bg-[#050505] text-white">
        <CopyProtectionClient />

        {/* 📌 [고정 상단 네비게이션 바 영역] */}
        <header className="sticky top-0 z-50 w-full border-b border-gray-800/60 bg-[#050505]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
            {/* 구단 로고 / 홈 링크 */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[#f2d272] tracking-wider cursor-pointer">
                GABBY UTD
              </span>
            </div>
            
            {/* 네비게이션 메뉴 목록 (예시) */}
            <nav className="flex items-center gap-6 text-xs font-bold text-gray-400">
              <a href="#" className="hover:text-[#f2d272] transition-colors">구단소식</a>
              <a href="#" className="hover:text-[#f2d272] transition-colors">경기결과</a>
              <a href="#" className="hover:text-[#f2d272] transition-colors">선수단</a>
              <a href="#" className="hover:text-[#f2d272] transition-colors">입단문의</a>
            </nav>
          </div>
        </header>

        {/* 📋 메인 콘텐츠 영역 (상단 바 높이만큼 자연스럽게 아래에 위치함) */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
