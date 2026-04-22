import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

const schema = z.object({
  content: z.string().min(1, "请填写评论内容"),
  type: z.enum(["GENERAL", "FEEDBACK", "APPROVAL"]).default("GENERAL"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id: versionId } = await params;
  const version = await prisma.version.findUnique({
    where: { id: versionId },
    include: { brief: true },
  });
  if (!version) return buildApiError("NOT_FOUND", "版本不存在", 404);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return buildApiError("VALIDATION_ERROR", parsed.error.message, 400);

  const comment = await prisma.comment.create({
    data: {
      versionId,
      authorId: session.user.id,
      content: parsed.data.content,
      type: parsed.data.type,
    },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });

  return buildApiSuccess(comment, 201);
}
