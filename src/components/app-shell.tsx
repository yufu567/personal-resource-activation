"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  Database,
  Inbox,
  Plug,
  Settings,
  ShieldCheck,
  Target,
  type LucideIcon
} from "lucide-react";
import type { ReactNode } from "react";

import { productNavigation, type ProductNavigationItem } from "@/lib/navigation";

const navIcons: Record<ProductNavigationItem["icon"], LucideIcon> = {
  inbox: Inbox,
  target: Target,
  review: CheckCircle2,
  connector: Plug,
  settings: Settings
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="product-shell">
      <aside className="app-sidebar" aria-label="产品导航">
        <Link className="brand-lockup" href="/resources" aria-label="资源激活系统">
          <span className="brand-mark">RA</span>
          <span>
            <strong>资源激活系统</strong>
            <small>Mock AI Workspace</small>
          </span>
        </Link>

        <nav className="nav-stack">
          {productNavigation.map((item) => {
            const Icon = navIcons[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} className={active ? "nav-item active" : "nav-item"} href={item.href}>
                <Icon size={18} aria-hidden />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <div>
            <p className="eyebrow">Personal Resource Activation</p>
            <h1>把收藏资源转成站内行动闭环</h1>
          </div>
          <div className="runtime-strip" aria-label="运行状态">
            <span>
              <ShieldCheck size={16} aria-hidden />
              Mock AI
            </span>
            <span>
              <Database size={16} aria-hidden />
              站内数据
            </span>
          </div>
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
