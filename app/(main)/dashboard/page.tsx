import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { RequesterDashboard } from "./RequesterDashboard";
import { DesignerDashboard } from "./DesignerDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role;

  if (role === "REQUESTER") {
    const [pending, inProgress, reviewing, revising, completed] = await Promise.all([
      prisma.brief.count({ where: { requesterId: userId, status: "PENDING" } }),
      prisma.brief.count({ where: { requesterId: userId, status: "IN_PROGRESS" } }),
      prisma.brief.count({ where: { requesterId: userId, status: "REVIEWING" } }),
      prisma.brief.count({ where: { requesterId: userId, status: "REVISING" } }),
      prisma.brief.count({ where: { requesterId: userId, status: "COMPLETED" } }),
    ]);

    const reviewing_briefs = await prisma.brief.findMany({
      where: { requesterId: userId, status: "REVIEWING" },
      include: { assignee: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return (
      <RequesterDashboard
        name={session.user.name ?? ""}
        counts={{ pending, inProgress, reviewing, revising, completed }}
        reviewingBriefs={reviewing_briefs}
      />
    );
  }

  if (role === "DESIGNER") {
    const [pendingPool, inProgress, revising, completed] = await Promise.all([
      prisma.brief.count({ where: { status: "PENDING", assigneeId: null } }),
      prisma.brief.count({ where: { assigneeId: userId, status: "IN_PROGRESS" } }),
      prisma.brief.count({ where: { assigneeId: userId, status: "REVISING" } }),
      prisma.brief.count({ where: { assigneeId: userId, status: "COMPLETED" } }),
    ]);

    return (
      <DesignerDashboard
        name={session.user.name ?? ""}
        counts={{ pendingPool, inProgress, revising, completed }}
      />
    );
  }

  // ADMIN → redirect to briefs
  redirect("/briefs");
}
