"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Inbox,
  LogIn,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Settings,
  Sparkles,
  Target,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/i18n/context";
import type { Locale } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  inbox: Inbox,
  target: Target,
  review: CheckCircle2,
  connector: Plug,
  settings: Settings,
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const { data: session } = useSession();
  const currentUser = session?.user ?? null;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    signOut({ callbackUrl: "/login" });
  }

  const toggleCollapsed = useCallback(() => setCollapsed((prev) => !prev), []);

  const navItems = [
    { href: "/resources", icon: "inbox", label: t("nav.resources"), desc: t("nav.resourcesDesc") },
    { href: "/goals", icon: "target", label: t("nav.goals"), desc: t("nav.goalsDesc") },
    { href: "/reviews", icon: "review", label: t("nav.reviews"), desc: t("nav.reviewsDesc") },
    { href: "/connectors", icon: "connector", label: t("nav.connectors"), desc: t("nav.connectorsDesc") },
    { href: "/settings", icon: "settings", label: t("nav.settings"), desc: t("nav.settingsDesc") },
  ];

  const localeLabel: Record<Locale, string> = { zh: "中文", en: "English" };

  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-20 flex flex-col border-r bg-sidebar transition-all duration-300",
          collapsed ? "w-[60px]" : "w-60",
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center gap-3 px-3 py-4", collapsed && "justify-center px-2")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold leading-tight text-sidebar-foreground">
                {t("app.brand")}
              </p>
              <p className="text-[10px] text-sidebar-foreground/50">Personal Resource Activation</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 overflow-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <div className="overflow-hidden">
                    <p className="truncate">{item.label}</p>
                    <p className="truncate text-[11px] opacity-60">{item.desc}</p>
                  </div>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs opacity-70">{item.desc}</span>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={cn("p-3", collapsed && "px-2")}>
          <Separator className="mb-3" />
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 text-[10px] text-sidebar-foreground/40">
              <Cpu className="h-3.5 w-3.5" />
              <Database className="h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="space-y-1.5 px-1 text-xs text-sidebar-foreground/55">
              <div className="flex items-center gap-2">
                <Cpu className="h-3 w-3" />
                <span>{t("app.mockAI")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3" />
                <span>{t("app.localData")}</span>
              </div>
              <p className="mt-1 text-[10px] text-sidebar-foreground/35">{t("app.scopeNote")}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main
        className={cn(
          "flex min-h-svh flex-1 flex-col transition-[margin] duration-300",
          collapsed ? "ml-[60px]" : "ml-60",
        )}
      >
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 [&>button]:hidden">
              <MobileSidebar
                pathname={pathname}
                onClose={() => setMobileOpen(false)}
                t={t}
                currentUser={currentUser}
                onLogout={logout}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden md:flex"
            onClick={toggleCollapsed}
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personal Resource Activation
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {t("app.subtitle")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex gap-1 text-[10px]">
              <Cpu className="h-3 w-3" />
              {t("app.mockAI")}
            </Badge>
            <Badge variant="secondary" className="hidden sm:flex gap-1 text-[10px]">
              <Database className="h-3 w-3" />
              {t("app.localData")}
            </Badge>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["zh", "en"] as Locale[]).map((l) => (
                  <DropdownMenuItem
                    key={l}
                    onClick={() => setLocale(l)}
                    className={cn(locale === l && "bg-accent")}
                  >
                    {localeLabel[l]}
                    {locale === l && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            {/* User Menu */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{currentUser.name ?? currentUser.email?.split("@")[0]}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  </div>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}

function MobileSidebar({
  pathname,
  onClose,
  t,
  currentUser,
  onLogout,
}: {
  pathname: string;
  onClose: () => void;
  t: (key: string) => string;
  currentUser: { name?: string | null; email?: string | null } | null;
  onLogout: () => void;
}) {
  const navItems = [
    { href: "/resources", icon: Inbox, label: t("nav.resources"), desc: t("nav.resourcesDesc") },
    { href: "/goals", icon: Target, label: t("nav.goals"), desc: t("nav.goalsDesc") },
    { href: "/reviews", icon: CheckCircle2, label: t("nav.reviews"), desc: t("nav.reviewsDesc") },
    { href: "/connectors", icon: Plug, label: t("nav.connectors"), desc: t("nav.connectorsDesc") },
    { href: "/settings", icon: Settings, label: t("nav.settings"), desc: t("nav.settingsDesc") },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/resources" onClick={onClose} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">资源激活系统</span>
        </Link>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3 overflow-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <div>
                <p className="truncate">{item.label}</p>
                <p className="truncate text-[11px] opacity-60">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-3">
        {currentUser ? (
          <div className="space-y-2">
            <p className="text-xs font-medium">{currentUser.name ?? currentUser.email?.split("@")[0]}</p>
            <p className="text-[11px] text-muted-foreground">{currentUser.email}</p>
            <Button variant="outline" size="sm" className="w-full" onClick={onLogout}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> 登出
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/login" onClick={onClose}>
              <LogIn className="h-3.5 w-3.5 mr-1.5" /> 登录
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
