import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

const schema = z.object({ assigneeId: z.string().optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) return buildApiError("NOT_FOUND", "需求单不存在", 404);
  if (brief.status !== "PENDING") return buildApiError("INVALID_STATE", "只有待接单状态的需求单可以被接单", 400);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const assigneeId = parsed.success && parsed.data.assigneeId
    ? parsed.data.assigneeId
    : session.user.id;

  const updated = await prisma.brief.update({
    where: { id },
    data: { assigneeId, status: "IN_PROGRESS" },
  });

  return buildApiSuccess(updated);
}
