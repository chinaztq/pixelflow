import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { RequesterDashboard } from "./RequesterDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [pending, inProgress, reviewing, revising, completed] = await Promise.all([
    prisma.brief.count({ where: { status: "PENDING" } }),
    prisma.brief.count({ where: { status: "IN_PROGRESS" } }),
    prisma.brief.count({ where: { status: "REVIEWING" } }),
    prisma.brief.count({ where: { status: "REVISING" } }),
    prisma.brief.count({ where: { status: "COMPLETED" } }),
  ]);

  const reviewing_briefs = await prisma.brief.findMany({
    where: { status: "REVIEWING" },
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
