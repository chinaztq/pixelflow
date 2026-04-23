import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";
import {
  processAndStoreReference,
  isAllowedMimeType,
  MAX_FILE_SIZE,
  MAX_FILES,
} from "@/lib/image/process";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id } = await params;
  const brief = await prisma.brief.findUnique({ where: { id } });
  if (!brief) return buildApiError("NOT_FOUND", "需求单不存在", 404);

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) return buildApiError("VALIDATION_ERROR", "请上传文件", 400);
  if (files.length > MAX_FILES) return buildApiError("VALIDATION_ERROR", `最多上传 ${MAX_FILES} 张`, 400);

  const results = [];
  for (const file of files) {
    if (!isAllowedMimeType(file.type)) continue;
    if (file.size > MAX_FILE_SIZE) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const ref = await processAndStoreReference(buffer, file.name, file.type, id);
    const saved = await prisma.referenceImage.create({
      data: { briefId: id, ...ref },
    });
    results.push(saved);
  }

  return buildApiSuccess(results, 201);
}
