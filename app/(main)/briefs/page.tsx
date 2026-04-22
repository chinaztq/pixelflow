import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { BriefTable } from "@/components/brief/BriefTable";
import { NewBriefDialog } from "@/components/brief/NewBriefDialog";
import type { BriefStatus, Priority } from "@prisma/client";

interface SearchParams {
  status?: string;
  channel?: string;
  priority?: string;
  page?: string;
}

export default async function BriefsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const pageSize = 20;
  const userId = session.user.id;
  const role = session.user.role;

  const roleFilter =
    role === "ADMIN"
      ? {}
      : role === "REQUESTER"
      ? { requesterId: userId }
      : { OR: [{ assigneeId: userId }, { assigneeId: null, status: "PENDING" as BriefStatus }] };

  const where = {
    ...roleFilter,
    ...(sp.status ? { status: sp.status as BriefStatus } : {}),
    ...(sp.channel ? { channel: sp.channel } : {}),
    ...(sp.priority ? { priority: sp.priority as Priority } : {}),
  };

  const [total, briefs, designers] = await Promise.all([
    prisma.brief.count({ where }),
    prisma.brief.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    role === "ADMIN" || role === "REQUESTER"
      ? prisma.user.findMany({
          where: { role: "DESIGNER", active: true },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const canCreate = role === "REQUESTER" || role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-medium" style={{ color: "var(--text)" }}>
          需求单
        </h1>
        {canCreate && <NewBriefDialog />}
      </div>

      <BriefTable
        briefs={briefs}
        total={total}
        page={page}
        pageSize={pageSize}
        designers={designers}
        role={role}
        currentFilters={{ status: sp.status, channel: sp.channel, priority: sp.priority }}
      />
    </div>
  );
}
