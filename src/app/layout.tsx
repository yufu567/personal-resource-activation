import type { Metadata } from "next";
import { I18nProvider } from "@/i18n/context";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initSentry } from "@/lib/sentry-report";
import "./globals.css";

// Initialize Sentry at server startup
initSentry();

export const metadata: Metadata = {
  title: "个人资源激活系统",
  description: "把收藏、链接、文件和网盘资源转成站内行动闭环。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-svh bg-background antialiased">
        <ThemeProvider defaultTheme="system" storageKey="pra-theme">
          <I18nProvider>
            <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
