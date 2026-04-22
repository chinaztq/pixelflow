"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Bell, Search, LogOut, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SessionUser } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  REQUESTER: "投手",
  DESIGNER:  "设计师",
  ADMIN:     "管理员",
};

interface TopBarProps {
  user: SessionUser;
  unreadCount?: number;
}

export function TopBar({ user, unreadCount = 0 }: TopBarProps) {
  const initials = (user.name ?? "?").slice(0, 2).toUpperCase();

  return (
    <header
      className="flex items-center justify-between h-12 px-4 border-b shrink-0"
      style={{ background: "#faf9f5", borderColor: "#e8e6dc" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-6 h-6 rounded-[8px] flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ background: "#c96442", color: "#faf9f5" }}
        >
          P
        </div>
        <span className="text-sm font-semibold" style={{ color: "#141413", letterSpacing: "-0.01em" }}>
          PixelFlow
        </span>
      </div>

      {/* Global search placeholder */}
      <button
        className="hidden md:flex items-center gap-2 h-8 px-3 rounded-[8px] border text-sm transition-all"
        style={{
          borderColor: "#e8e6dc",
          color: "#87867f",
          minWidth: 220,
          background: "#f5f4ed",
          boxShadow: "0px 0px 0px 1px transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0px 0px 0px 1px #d1cfc5")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0px 0px 0px 1px transparent")}
        onClick={() => {}}
      >
        <Search size={13} strokeWidth={1.5} />
        <span className="flex-1 text-left" style={{ fontSize: 12 }}>搜索…</span>
        <kbd
          className="text-[10px] px-1.5 rounded-[4px] border"
          style={{ borderColor: "#e8e6dc", color: "#b0aea5", background: "#faf9f5" }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <Link
          href="/notifications"
          className="relative flex items-center justify-center w-8 h-8 rounded-[8px] transition-all"
          style={{ color: "#87867f" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "#141413";
            (e.currentTarget as HTMLAnchorElement).style.background = "#f0eee6";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = "#87867f";
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          <Bell size={15} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full"
              style={{
                minWidth: 15,
                height: 15,
                fontSize: 9,
                background: "#c96442",
                color: "#faf9f5",
                padding: "0 3px",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-[8px] transition-all"
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0eee6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback
                  className="text-[9px] font-semibold"
                  style={{ background: "rgba(201,100,66,0.15)", color: "#c96442" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden md:block font-medium" style={{ color: "#141413" }}>
                {user.name}
              </span>
              <span
                className="text-[10px] hidden md:block px-1.5 py-0.5 rounded-[6px]"
                style={{ background: "#e8e6dc", color: "#5e5d59" }}
              >
                {ROLE_LABEL[user.role]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 rounded-[8px] border p-1"
            style={{
              background: "#faf9f5",
              borderColor: "#e8e6dc",
              boxShadow: "rgba(0,0,0,0.08) 0px 8px 32px, 0px 0px 0px 1px #e8e6dc",
            }}
          >
            <DropdownMenuItem asChild className="rounded-[6px] text-sm cursor-pointer">
              <Link href="/settings" className="flex items-center gap-2" style={{ color: "#5e5d59" }}>
                <User size={13} strokeWidth={1.5} />
                个人设置
              </Link>
            </DropdownMenuItem>
            {user.role === "ADMIN" && (
              <DropdownMenuItem asChild className="rounded-[6px] text-sm cursor-pointer">
                <Link href="/admin/users" className="flex items-center gap-2" style={{ color: "#5e5d59" }}>
                  <Settings size={13} strokeWidth={1.5} />
                  用户管理
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator style={{ background: "#e8e6dc" }} />
            <DropdownMenuItem
              className="rounded-[6px] text-sm cursor-pointer"
              style={{ color: "#b53333" }}
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut size={13} strokeWidth={1.5} className="mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
