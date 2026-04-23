import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id: versionId } = await params;
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    include: { brief: true, images: true },
  });
  if (!version) return buildApiError("NOT_FOUND", "版本不存在", 404);

  if (!["PENDING_REVIEW", "APPROVED"].includes(version.status)) {
    return buildApiError("INVALID_STATE", "当前状态不可采用", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.version.update({ where: { id: versionId }, data: { status: "ADOPTED" } });

    // Archive all images of this version
    await tx.image.updateMany({
      where: { versionId },
      data: { isArchived: true },
    });

    // Complete the brief
    await tx.brief.update({
      where: { id: version.briefId },
      data: { status: "COMPLETED", finalVersionId: versionId },
    });
  });

  const updated = await prisma.version.findUnique({ where: { id: versionId } });
  return buildApiSuccess(updated);
}
