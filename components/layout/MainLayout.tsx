"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import type { SessionUser } from "@/types";

interface MainLayoutProps {
  user: SessionUser;
  unreadCount?: number;
  children: React.ReactNode;
}

export function MainLayout({ user, unreadCount = 0, children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar user={user} unreadCount={unreadCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: "var(--background)" }}
        >
          <div className="px-6 py-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
