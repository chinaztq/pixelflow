import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { formatRelativeTime } from "@/lib/utils";
import { MarkAllRead } from "./MarkAllRead";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-medium" style={{ color: "var(--text)" }}>
          通知
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full text-white" style={{ background: "var(--error)" }}>
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && <MarkAllRead />}
      </div>

      <div
        className="rounded-[6px] border overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        {notifications.length === 0 ? (
          <div
            className="py-12 text-center text-sm"
            style={{ background: "var(--card)", color: "var(--text-muted)" }}
          >
            暂无通知
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              className="flex items-start gap-3 px-4 py-3 border-t first:border-t-0 transition-colors hover:bg-[var(--hover-bg)]"
              style={{
                background: n.read ? "var(--card)" : "rgba(59,130,246,0.04)",
                borderColor: "var(--border)",
              }}
            >
              {!n.read && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <div className="flex-1 min-w-0" style={{ marginLeft: n.read ? "18px" : 0 }}>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{n.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{n.content}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="inline-flex text-xs mt-1 hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    查看详情 →
                  </Link>
                )}
              </div>
              <span className="text-xs shrink-0" style={{ color: "var(--text-subtle)" }}>
                {formatRelativeTime(n.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
