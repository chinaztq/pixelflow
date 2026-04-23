import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const brief = await prisma.brief.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, avatar: true } },
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      references: true,
      versions: {
        orderBy: { versionNo: "asc" },
        include: {
          uploader: { select: { id: true, name: true, avatar: true } },
          images: true,
          comments: {
            include: { author: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!brief) return buildApiError("NOT_FOUND", "需求单不存在", 404);

  return buildApiSuccess(brief);
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  channel: z.string().optional(),
  audience: z.string().optional(),
  product: z.string().optional(),
  specs: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  deadline: z.string().datetime().optional().nullable(),
  description: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) return buildApiError("NOT_FOUND", "需求单不存在", 404);

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return buildApiError("VALIDATION_ERROR", parsed.error.message, 400);

  const { deadline, ...rest } = parsed.data;
  const updated = await prisma.brief.update({
    where: { id },
    data: {
      ...rest,
      ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
    },
  });

  return buildApiSuccess(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) return buildApiError("NOT_FOUND", "需求单不存在", 404);

  if (brief.status !== "PENDING") {
    return buildApiError("INVALID_STATE", "只有待接单状态的需求单可以删除", 400);
  }

  await prisma.brief.delete({ where: { id } });
  return buildApiSuccess({ id });
}
