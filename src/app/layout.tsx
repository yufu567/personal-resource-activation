import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人资源激活系统",
  description: "把收藏、链接、文件和网盘资源转成站内行动闭环。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
