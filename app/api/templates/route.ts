import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";
import {
  processAndStoreTemplate,
  isAllowedMimeType,
  MAX_FILE_SIZE,
  MAX_FILES,
} from "@/lib/image/process";
import { storage } from "@/lib/storage/local-adapter";

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { id: true, name: true, avatar: true } },
    },
  });

  return buildApiSuccess(templates);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const title = formData.get("title") as string | null;
  const note = formData.get("note") as string | null;

  if (files.length === 0) return buildApiError("VALIDATION_ERROR", "请上传文件", 400);
  if (files.length > MAX_FILES) return buildApiError("VALIDATION_ERROR", `最多上传 ${MAX_FILES} 张`, 400);

  for (const file of files) {
    if (!isAllowedMimeType(file.type)) {
      return buildApiError("VALIDATION_ERROR", `不支持的文件格式: ${file.type}`, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return buildApiError("VALIDATION_ERROR", `文件 ${file.name} 超过 20MB 限制`, 400);
    }
  }

  const results = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    const template = await prisma.template.create({
      data: {
        title: title ?? undefined,
        note: note ?? undefined,
        uploaderId: session.user.id,
        filename: "",
        originalName: "",
        filePath: "",
        thumbnailPath: "",
        previewPath: "",
        mimeType: "",
        size: 0,
        width: 0,
        height: 0,
      },
    });

    try {
      const processed = await processAndStoreTemplate(
        buffer,
        file.name,
        file.type as Parameters<typeof processAndStoreTemplate>[2],
        template.id
      );

      const updated = await prisma.template.update({
        where: { id: template.id },
        data: processed,
      });
      results.push(updated);
    } catch (err) {
      await prisma.template.delete({ where: { id: template.id } }).catch(() => {});
      throw err;
    }
  }

  return buildApiSuccess(results, 201);
}
