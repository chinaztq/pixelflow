"use client";

interface DesignerDashboardProps {
  name: string;
  counts: {
    pendingPool: number;
    inProgress: number;
    revising: number;
    completed: number;
  };
}

interface StatCardProps {
  label: string;
  value: number;
  description?: string;
  accent?: boolean;
}

function StatCard({ label, value, description, accent }: StatCardProps) {
  return (
    <div
      className="p-5 rounded-[8px] border"
      style={{
        background: "#faf9f5",
        borderColor: accent ? "rgba(201,100,66,0.25)" : "#e8e6dc",
        boxShadow: accent
          ? "rgba(0,0,0,0.04) 0px 2px 8px, 0px 0px 0px 1px rgba(201,100,66,0.12)"
          : "rgba(0,0,0,0.02) 0px 2px 8px",
      }}
    >
      <p className="text-xs mb-3" style={{ color: "#87867f" }}>{label}</p>
      <p
        className="text-3xl font-semibold"
        style={{ color: accent ? "#c96442" : "#141413", letterSpacing: "-0.02em", lineHeight: 1 }}
      >
        {value}
      </p>
      {description && (
        <p className="text-xs mt-2" style={{ color: "#b0aea5" }}>
          {description}
        </p>
      )}
    </div>
  );
}

export function DesignerDashboard({ name, counts }: DesignerDashboardProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "#141413", letterSpacing: "-0.01em" }}>
          你好，{name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#87867f" }}>
          以下是你的工作台概况
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="可接单"
          value={counts.pendingPool}
          description="公共需求池"
          accent={counts.pendingPool > 0}
        />
        <StatCard label="进行中" value={counts.inProgress} />
        <StatCard
          label="待修改"
          value={counts.revising}
          accent={counts.revising > 0}
        />
        <StatCard label="已完成" value={counts.completed} description="累计完成" />
      </div>
    </div>
  );
}
