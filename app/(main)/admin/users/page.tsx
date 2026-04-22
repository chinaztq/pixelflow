import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  const ROLE_LABEL: Record<string, string> = { REQUESTER: "投手", DESIGNER: "设计师", ADMIN: "管理员" };

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-base font-medium" style={{ color: "var(--text)" }}>用户管理</h1>
      <div className="rounded-[6px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div
          className="grid grid-cols-[1fr_200px_100px_80px_120px] text-xs h-10 items-center px-4 gap-4"
          style={{ background: "var(--background)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
        >
          <span>姓名</span>
          <span>邮箱</span>
          <span>角色</span>
          <span>状态</span>
          <span>创建时间</span>
        </div>
        {users.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-[1fr_200px_100px_80px_120px] h-12 items-center px-4 gap-4 text-sm border-t"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--text)" }}>{user.name}</span>
            <span className="truncate" style={{ color: "var(--text-muted)" }}>{user.email}</span>
            <span style={{ color: "var(--text-muted)" }}>{ROLE_LABEL[user.role]}</span>
            <span style={{ color: user.active ? "var(--success)" : "var(--text-subtle)" }}>
              {user.active ? "启用" : "停用"}
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {new Date(user.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
