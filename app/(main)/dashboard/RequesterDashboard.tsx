"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Brief } from "@prisma/client";

interface RequesterDashboardProps {
  name: string;
  counts: {
    pending: number;
    inProgress: number;
    reviewing: number;
    revising: number;
    completed: number;
  };
  reviewingBriefs: Array<Brief & { assignee: { id: string; name: string } | null }>;
}

interface StatCardProps {
  label: string;
  value: number;
  href: string;
  accent?: boolean;
}

function StatCard({ label, value, href, accent }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block p-5 rounded-[8px] border transition-all"
      style={{
        background: "#faf9f5",
        borderColor: accent ? "rgba(201,100,66,0.25)" : "#e8e6dc",
        boxShadow: accent
          ? "rgba(0,0,0,0.04) 0px 2px 8px, 0px 0px 0px 1px rgba(201,100,66,0.12)"
          : "rgba(0,0,0,0.02) 0px 2px 8px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "rgba(0,0,0,0.06) 0px 4px 16px, 0px 0px 0px 1px #d1cfc5";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "#d1cfc5";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = accent
          ? "rgba(0,0,0,0.04) 0px 2px 8px, 0px 0px 0px 1px rgba(201,100,66,0.12)"
          : "rgba(0,0,0,0.02) 0px 2px 8px";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = accent ? "rgba(201,100,66,0.25)" : "#e8e6dc";
      }}
    >
      <p className="text-xs mb-3" style={{ color: "#87867f" }}>{label}</p>
      <p
        className="text-3xl font-semibold"
        style={{ color: accent ? "#c96442" : "#141413", letterSpacing: "-0.02em", lineHeight: 1 }}
      >
        {value}
      </p>
    </Link>
  );
}

export function RequesterDashboard({ name, counts, reviewingBriefs }: RequesterDashboardProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "#141413", letterSpacing: "-0.01em" }}>
          你好，{name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#87867f" }}>
          以下是你的需求单概况
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="待接单" value={counts.pending} href="/briefs?status=PENDING" />
        <StatCard label="进行中" value={counts.inProgress} href="/briefs?status=IN_PROGRESS" />
        <StatCard label="审阅中" value={counts.reviewing} href="/briefs?status=REVIEWING" accent={counts.reviewing > 0} />
        <StatCard label="修改中" value={counts.revising} href="/briefs?status=REVISING" accent={counts.revising > 0} />
        <StatCard label="已完成" value={counts.completed} href="/briefs?status=COMPLETED" />
      </div>

      {reviewingBriefs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium" style={{ color: "#141413" }}>
              待我审阅
            </h2>
            <Link
              href="/briefs?status=REVIEWING"
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "#87867f" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#c96442")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#87867f")}
            >
              全部
              <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
          <div
            className="rounded-[8px] border overflow-hidden"
            style={{ borderColor: "#e8e6dc", boxShadow: "rgba(0,0,0,0.02) 0px 2px 8px" }}
          >
            {reviewingBriefs.map((brief, i) => (
              <Link
                key={brief.id}
                href={`/briefs/${brief.id}`}
                className="flex items-center justify-between px-4 h-11 text-sm transition-colors"
                style={{
                  borderTop: i > 0 ? "1px solid #f0eee6" : undefined,
                  background: "#faf9f5",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#f5f4ed";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "#faf9f5";
                }}
              >
                <span className="font-medium" style={{ color: "#141413" }}>{brief.title}</span>
                <span style={{ color: "#87867f" }}>{brief.assignee?.name ?? "未指派"}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
