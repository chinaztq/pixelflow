"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import type { Brief } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CHANNELS = ["Facebook", "Instagram", "Google", "TikTok", "其他"];
const STATUSES = [
  { value: "", label: "全部状态" },
  { value: "PENDING", label: "待接单" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "REVIEWING", label: "审阅中" },
  { value: "REVISING", label: "修改中" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];
const PRIORITIES = [
  { value: "", label: "全部优先级" },
  { value: "URGENT", label: "紧急" },
  { value: "HIGH", label: "高" },
  { value: "MEDIUM", label: "中" },
  { value: "LOW", label: "低" },
];

interface BriefRow extends Brief {
  requester: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  _count: { versions: number };
}

interface BriefTableProps {
  briefs: BriefRow[];
  total: number;
  page: number;
  pageSize: number;
  currentFilters: { status?: string; channel?: string; priority?: string };
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 px-2.5 rounded-[8px] border text-xs appearance-none cursor-pointer transition-all"
      style={{
        background: "#faf9f5",
        borderColor: value ? "rgba(201,100,66,0.3)" : "#e8e6dc",
        color: value ? "#c96442" : "#87867f",
        minWidth: 100,
        boxShadow: value ? "0px 0px 0px 1px rgba(201,100,66,0.15)" : "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#faf9f5", color: "#141413" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function BriefTable({
  briefs,
  total,
  page,
  pageSize,
  currentFilters,
}: BriefTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterSelect
          name="status"
          value={currentFilters.status ?? ""}
          options={STATUSES}
          onChange={(v) => updateFilter("status", v)}
        />
        <FilterSelect
          name="channel"
          value={currentFilters.channel ?? ""}
          options={[{ value: "", label: "全部渠道" }, ...CHANNELS.map((c) => ({ value: c, label: c }))]}
          onChange={(v) => updateFilter("channel", v)}
        />
        <FilterSelect
          name="priority"
          value={currentFilters.priority ?? ""}
          options={PRIORITIES}
          onChange={(v) => updateFilter("priority", v)}
        />
        <span className="text-xs ml-auto" style={{ color: "#b0aea5" }}>
          共 {total} 条
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-[8px] border overflow-hidden"
        style={{ borderColor: "#e8e6dc", boxShadow: "rgba(0,0,0,0.03) 0px 2px 8px" }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[1fr_90px_80px_120px_90px_110px_110px] text-xs h-9 items-center px-4 gap-4"
          style={{
            background: "#f5f4ed",
            color: "#87867f",
            borderBottom: "1px solid #e8e6dc",
          }}
        >
          <span>标题</span>
          <span>渠道</span>
          <span>优先级</span>
          <span>指派人</span>
          <span>状态</span>
          <span>截止日</span>
          <span>更新时间</span>
        </div>

        {briefs.length === 0 ? (
          <div style={{ background: "#faf9f5" }}>
            <EmptyState title="暂无需求单" description="调整筛选条件或新建需求单" />
          </div>
        ) : (
          briefs.map((brief) => (
            <Link
              key={brief.id}
              href={`/briefs/${brief.id}`}
              className="grid grid-cols-[1fr_90px_80px_120px_90px_110px_110px] h-11 items-center px-4 gap-4 text-sm border-t transition-all group"
              style={{ background: "#faf9f5", borderColor: "#f0eee6" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f4ed")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#faf9f5")}
            >
              <span
                className="truncate font-medium group-hover:text-[#c96442] transition-colors"
                style={{ color: "#141413" }}
              >
                {brief.title}
              </span>
              <span className="truncate text-xs" style={{ color: "#87867f" }}>
                {brief.channel}
              </span>
              <span>
                <PriorityBadge priority={brief.priority} />
              </span>
              <span className="truncate text-xs" style={{ color: "#87867f" }}>
                {brief.assignee?.name ?? "未指派"}
              </span>
              <span>
                <StatusBadge status={brief.status} />
              </span>
              <span className="text-xs" style={{ color: "#b0aea5" }} suppressHydrationWarning>
                {brief.deadline ? formatDate(brief.deadline) : "—"}
              </span>
              <span className="text-xs" style={{ color: "#b0aea5" }} suppressHydrationWarning>
                {formatDate(brief.updatedAt)}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center justify-center w-7 h-7 rounded-[8px] border text-xs disabled:opacity-40 transition-all"
            style={{ borderColor: "#e8e6dc", color: "#87867f", background: "#faf9f5" }}
            onMouseEnter={(e) => { if (page > 1) { e.currentTarget.style.borderColor = "#c96442"; e.currentTarget.style.color = "#c96442"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e6dc"; e.currentTarget.style.color = "#87867f"; }}
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
          </button>
          <span className="text-xs px-2" style={{ color: "#87867f" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center justify-center w-7 h-7 rounded-[8px] border text-xs disabled:opacity-40 transition-all"
            style={{ borderColor: "#e8e6dc", color: "#87867f", background: "#faf9f5" }}
            onMouseEnter={(e) => { if (page < totalPages) { e.currentTarget.style.borderColor = "#c96442"; e.currentTarget.style.color = "#c96442"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e6dc"; e.currentTarget.style.color = "#87867f"; }}
          >
            <ChevronRight size={13} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
