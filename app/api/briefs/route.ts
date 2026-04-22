import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

const querySchema = z.object({
  status: z.string().optional(),
  channel: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { searchParams } = request.nextUrl;
  const params = querySchema.parse(Object.fromEntries(searchParams));
  const { page, pageSize, ...filters } = params;

  const userId = session.user.id;
  const role = session.user.role;

  // Build role-based base filter
  const roleFilter =
    role === "ADMIN"
      ? {}
      : role === "REQUESTER"
      ? { requesterId: userId }
      : {
          OR: [{ assigneeId: userId }, { assigneeId: null, status: "PENDING" as const }],
        };

  const where = {
    ...roleFilter,
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.priority ? { priority: filters.priority as never } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.brief.count({ where }),
    prisma.brief.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return buildApiSuccess({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  channel: z.string().min(1),
  audience: z.string().optional(),
  product: z.string().optional(),
  specs: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  deadline: z.string().datetime().optional(),
  description: z.string().min(1),
  assigneeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);
  if (session.user.role === "DESIGNER") return buildApiError("FORBIDDEN", "无权限", 403);

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return buildApiError("VALIDATION_ERROR", parsed.error.message, 400);

  const { deadline, ...rest } = parsed.data;
  const brief = await prisma.brief.create({
    data: {
      ...rest,
      deadline: deadline ? new Date(deadline) : undefined,
      requesterId: session.user.id,
    },
  });

  return buildApiSuccess(brief, 201);
}
