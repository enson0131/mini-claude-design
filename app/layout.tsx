import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Claude Design",
  description: "基于智谱 AI 的网页设计助手",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-mono bg-[#1a1a2e] text-[#e0e0e0]">{children}</body>
    </html>
  );
}
