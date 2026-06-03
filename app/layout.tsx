import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 💡 클라이언트 측 이벤트를 처리하기 위한 서브 컴포넌트 유입
import CopyProtectionClient from "./components/CopyProtectionClient";
import VisitLogger from "./components/VisitLogger";

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
      // 💎 드래그 차단을 위한 CSS 클래스 'select-none' 적용 (Tailwind)
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased select-none`}
    >
      <body className="min-h-full flex flex-col">
        {/* 🔒 브라우저 단축키 및 우클릭을 차단하는 보안 컴포넌트 작동 */}
        <CopyProtectionClient />
        <VisitLogger />
        {children}
      </body>
    </html>
  );
}
