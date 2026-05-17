"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, House, BookOpenText, BrainCircuit, Users, Settings, CalendarDays, Network } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "总览", icon: House },
  { href: "/dreams/new", label: "记录梦境", icon: BookOpenText },
  { href: "/timeline", label: "时间轴", icon: CalendarDays },
  { href: "/elements", label: "元素图谱", icon: Network },
  { href: "/insights", label: "洞察报告", icon: BrainCircuit },
  { href: "/community", label: "共享梦境", icon: Users },
  { href: "/settings", label: "设置", icon: Settings }
];

export function AppShell({
  children,
  userName,
  userEmail,
  isGuest = false,
  isDemoMode = false
}: {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  isGuest?: boolean;
  isDemoMode?: boolean;
}) {
  const currentPath = usePathname();
  const displayUserName = userName === "DreamSpirit 梦灵体验账号" ? "DreamSpirit 体验账号" : userName;

  return (
    <div className="app-layout">
      <aside className="app-sidebar stack-lg">
        <div className="stack-sm">
          <span className="brand-mark">
            <span className="brand-orb" />
            DreamSpirit 梦灵
          </span>
          <div>
            <h1 className="panel-title">梦境工作台</h1>
            <p className="muted-text">记录你的梦境，<br></br>看见藏在其中的自己</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={cn("nav-link", active && "active")}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <Icon size={16} />
                  {item.label}
                </span>
                <Sparkles size={14} />
              </Link>
            );
          })}
        </nav>

        <div className="divider" />

        <div className="stack-md">
          <div className="card">
            <div className="field-label">当前账号</div>
            <div style={{ fontWeight: 800, marginTop: 8 }}>{isGuest ? "访客浏览" : displayUserName || "Dreamer"}</div>
            <p className="helper-text">
              {isGuest
                ? `当前正在浏览 ${displayUserName || "DreamSpirit 体验账号"} 的公开体验数据。`
                : userEmail || "当前账号会使用数据库保存梦境记录。"}
            </p>
          </div>
          {isDemoMode ? <div className="notice">当前为访客浏览模式，只开放读取与浏览能力。</div> : null}
          {isGuest ? (
            <Link className="button button-secondary" href="/sign-in">
              查看登录页
            </Link>
          ) : (
            <LogoutButton />
          )}
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
