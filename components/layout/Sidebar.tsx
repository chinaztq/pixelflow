"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Image,
  Layers,
  Bell,
  Users,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/briefs",    label: "需求单",  icon: FileText },
  { href: "/library",  label: "素材库",  icon: Image },
  { href: "/templates", label: "模板库",  icon: Layers },
  { href: "/notifications", label: "通知", icon: Bell },
  { href: "/admin/users",   label: "用户管理", icon: Users },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const items = NAV_ITEMS;

  return (
    <aside
      className="flex flex-col h-full border-r transition-all duration-200 shrink-0"
      style={{
        width: collapsed ? 52 : 200,
        background: "#faf9f5",
        borderColor: "#e8e6dc",
      }}
    >
      <div className="flex-1 py-3 overflow-hidden">
        <nav className="space-y-0.5 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-[8px] text-sm transition-all",
                  collapsed ? "justify-center px-0 h-9 w-9 mx-auto" : "h-8 px-2.5",
                )}
                style={
                  active
                    ? {
                        color: "#c96442",
                        background: "rgba(201,100,66,0.08)",
                        boxShadow: "0px 0px 0px 1px rgba(201,100,66,0.15)",
                      }
                    : { color: "#5e5d59" }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#141413";
                    (e.currentTarget as HTMLAnchorElement).style.background = "#f0eee6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#5e5d59";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                  }
                }}
              >
                <Icon className="shrink-0" size={15} strokeWidth={active ? 2 : 1.5} />
                {!collapsed && (
                  <span className="truncate text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-9 border-t transition-all"
        style={{
          borderColor: "#e8e6dc",
          color: "#b0aea5",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#5e5d59";
          (e.currentTarget as HTMLButtonElement).style.background = "#f0eee6";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#b0aea5";
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
        title={collapsed ? "展开侧栏" : "收起侧栏"}
      >
        <ChevronLeft
          size={14}
          strokeWidth={1.5}
          className={cn("transition-transform duration-200", collapsed && "rotate-180")}
        />
      </button>
    </aside>
  );
}
