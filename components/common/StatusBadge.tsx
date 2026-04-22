import type { BriefStatus, Priority, VersionStatus } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  color?: "terracotta" | "green" | "amber" | "red" | "warm" | "stone" | "purple";
  className?: string;
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  terracotta: { bg: "rgba(201,100,66,0.10)", text: "#a05030", border: "rgba(201,100,66,0.25)" },
  green:      { bg: "#f0f7f1",               text: "#3a6b44", border: "#c3dfc8" },
  amber:      { bg: "#fdf8ed",               text: "#92680f", border: "#f0d99a" },
  red:        { bg: "#fdf1f1",               text: "#b53333", border: "#f5c5c5" },
  warm:       { bg: "#f5f4ed",               text: "#5e5d59", border: "#e8e6dc" },
  stone:      { bg: "#f7f6f2",               text: "#87867f", border: "#e8e6dc" },
  purple:     { bg: "rgba(109,69,173,0.08)", text: "#6d45ad", border: "rgba(109,69,173,0.2)" },
};

export function Badge({ children, color = "warm", className = "" }: BadgeProps) {
  const c = colorMap[color] ?? colorMap.warm!;
  return (
    <span
      className={`inline-flex items-center rounded-[6px] px-2 text-xs font-medium leading-5 border ${className}`}
      style={{ height: 20, background: c.bg, color: c.text, borderColor: c.border }}
    >
      {children}
    </span>
  );
}

const STATUS_MAP: Record<BriefStatus, { label: string; color: BadgeProps["color"] }> = {
  PENDING:     { label: "待接单", color: "stone" },
  IN_PROGRESS: { label: "进行中", color: "terracotta" },
  REVIEWING:   { label: "审阅中", color: "amber" },
  REVISING:    { label: "修改中", color: "red" },
  COMPLETED:   { label: "已完成", color: "green" },
  CANCELLED:   { label: "已取消", color: "stone" },
};

const PRIORITY_MAP: Record<Priority, { label: string; color: BadgeProps["color"] }> = {
  LOW:    { label: "低", color: "stone" },
  MEDIUM: { label: "中", color: "warm" },
  HIGH:   { label: "高", color: "amber" },
  URGENT: { label: "紧急", color: "red" },
};

const VERSION_STATUS_MAP: Record<VersionStatus, { label: string; color: BadgeProps["color"] }> = {
  PENDING_REVIEW: { label: "待审阅", color: "amber" },
  APPROVED:       { label: "已通过", color: "green" },
  REJECTED:       { label: "已打回", color: "red" },
  ADOPTED:        { label: "已采用", color: "purple" },
};

export function StatusBadge({ status }: { status: BriefStatus }) {
  const s = STATUS_MAP[status];
  return <Badge color={s?.color}>{s?.label ?? status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY_MAP[priority];
  return <Badge color={p?.color}>{p?.label ?? priority}</Badge>;
}

export function VersionStatusBadge({ status }: { status: VersionStatus }) {
  const s = VERSION_STATUS_MAP[status];
  return <Badge color={s?.color}>{s?.label ?? status}</Badge>;
}
