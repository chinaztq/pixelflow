import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

const approveSchema = z.object({ comment: z.string().optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id: versionId } = await params;
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    include: { brief: true },
  });
  if (!version) return buildApiError("NOT_FOUND", "版本不存在", 404);

  const canReview =
    session.user.role === "ADMIN" ||
    (session.user.role === "REQUESTER" && version.brief.requesterId === session.user.id);
  if (!canReview) return buildApiError("FORBIDDEN", "无权限", 403);

  if (version.status !== "PENDING_REVIEW") {
    return buildApiError("INVALID_STATE", "只有待审阅的版本可以通过", 400);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = approveSchema.safeParse(body);

  await prisma.$transaction(async (tx) => {
    await tx.version.update({ where: { id: versionId }, data: { status: "APPROVED" } });

    if (parsed.success && parsed.data.comment) {
      await tx.comment.create({
        data: {
          versionId,
          authorId: session.user.id,
          content: parsed.data.comment,
          type: "APPROVAL",
        },
      });
    }
  });

  const updated = await prisma.version.findUnique({ where: { id: versionId }, include: { images: true, comments: { include: { author: { select: { id: true, name: true, avatar: true } } } } } });
  return buildApiSuccess(updated);
}
