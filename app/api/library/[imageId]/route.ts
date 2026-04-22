import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

const schema = z.object({ tags: z.array(z.string()) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { imageId } = await params;
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) return buildApiError("NOT_FOUND", "图片不存在", 404);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return buildApiError("VALIDATION_ERROR", parsed.error.message, 400);

  // Upsert tags
  const tagRecords = await Promise.all(
    parsed.data.tags.map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const updated = await prisma.image.update({
    where: { id: imageId },
    data: { tags: { set: tagRecords.map((t) => ({ id: t.id })) } },
    include: { tags: true },
  });

  return buildApiSuccess(updated);
}
