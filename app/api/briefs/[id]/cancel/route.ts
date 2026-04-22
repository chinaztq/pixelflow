import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) return buildApiError("NOT_FOUND", "需求单不存在", 404);

  const canCancel =
    session.user.role === "ADMIN" ||
    (session.user.role === "REQUESTER" && brief.requesterId === session.user.id);
  if (!canCancel) return buildApiError("FORBIDDEN", "无权限", 403);

  if (brief.status === "COMPLETED" || brief.status === "CANCELLED") {
    return buildApiError("INVALID_STATE", "当前状态不可取消", 400);
  }

  const updated = await prisma.brief.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return buildApiSuccess(updated);
}
