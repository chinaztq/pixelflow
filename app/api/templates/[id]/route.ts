import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage/local-adapter";
import { buildApiSuccess, buildApiError } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { title, note } = body;

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return buildApiError("NOT_FOUND", "模板不存在", 404);

  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title || null } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });

  return buildApiSuccess(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return buildApiError("NOT_FOUND", "模板不存在", 404);

  await prisma.template.delete({ where: { id } });

  // Clean up files
  for (const path of [template.filePath, template.thumbnailPath, template.previewPath]) {
    try {
      await storage.delete(path);
    } catch {
      // ignore
    }
  }

  return buildApiSuccess({ id });
}
