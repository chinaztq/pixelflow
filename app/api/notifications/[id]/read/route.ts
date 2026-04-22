import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== session.user.id) return buildApiError("NOT_FOUND", "通知不存在", 404);

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  return buildApiSuccess(updated);
}
