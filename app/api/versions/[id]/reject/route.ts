import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

const rejectSchema = z.object({ reason: z.string().min(1, "请填写反馈意见") });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id: versionId } = await params;
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    include: { brief: true },
  });
  if (!version) return buildApiError("NOT_FOUND", "版本不存在", 404);

  if (version.status !== "PENDING_REVIEW") {
    return buildApiError("INVALID_STATE", "只有待审阅的版本可以打回", 400);
  }

  const body = await request.json();
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) return buildApiError("VALIDATION_ERROR", parsed.error.message, 400);

  await prisma.$transaction(async (tx) => {
    await tx.version.update({ where: { id: versionId }, data: { status: "REJECTED" } });
    await tx.comment.create({
      data: {
        versionId,
        authorId: session.user.id,
        content: parsed.data.reason,
        type: "FEEDBACK",
      },
    });
    await tx.brief.update({
      where: { id: version.briefId },
      data: { status: "REVISING" },
    });
  });

  const updated = await prisma.version.findUnique({ where: { id: versionId }, include: { images: true, comments: { include: { author: { select: { id: true, name: true, avatar: true } } } } } });
  return buildApiSuccess(updated);
}
