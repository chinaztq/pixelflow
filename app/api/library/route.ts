import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 30;
  const channel = searchParams.get("channel");
  const tag = searchParams.get("tag");

  const where = {
    isArchived: true,
    ...(channel ? { version: { brief: { channel } } } : {}),
    ...(tag ? { tags: { some: { name: tag } } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.image.count({ where }),
    prisma.image.findMany({
      where,
      include: {
        tags: true,
        version: {
          include: { brief: { select: { id: true, title: true, channel: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return buildApiSuccess({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
