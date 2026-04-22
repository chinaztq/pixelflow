import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { buildApiSuccess, buildApiError } from "@/lib/utils";
import {
  processAndStoreImage,
  isAllowedMimeType,
  MAX_FILE_SIZE,
  MAX_FILES,
} from "@/lib/image/process";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return buildApiError("UNAUTHORIZED", "请先登录", 401);

  const { id: briefId } = await params;
  const brief = await prisma.brief.findUnique({ where: { id: briefId } });
  if (!brief) return buildApiError("NOT_FOUND", "需求单不存在", 404);

  const canUpload =
    session.user.role === "ADMIN" ||
    (session.user.role === "DESIGNER" && brief.assigneeId === session.user.id);
  if (!canUpload) return buildApiError("FORBIDDEN", "无权限", 403);

  if (brief.status === "COMPLETED" || brief.status === "CANCELLED") {
    return buildApiError("INVALID_STATE", "需求单已结束，不可再上传", 400);
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const note = formData.get("note") as string | null;
  const basedOnVersionId = formData.get("basedOnVersionId") as string | null;

  if (files.length === 0) return buildApiError("VALIDATION_ERROR", "请上传文件", 400);
  if (files.length > MAX_FILES) return buildApiError("VALIDATION_ERROR", `最多上传 ${MAX_FILES} 张`, 400);

  // Validate all files first
  for (const file of files) {
    if (!isAllowedMimeType(file.type)) {
      return buildApiError("VALIDATION_ERROR", `不支持的文件格式: ${file.type}`, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return buildApiError("VALIDATION_ERROR", `文件 ${file.name} 超过 20MB 限制`, 400);
    }
  }

  // Get next version number
  const lastVersion = await prisma.version.findFirst({
    where: { briefId },
    orderBy: { versionNo: "desc" },
  });
  const versionNo = (lastVersion?.versionNo ?? 0) + 1;

  // Create version record first to get versionId
  const version = await prisma.version.create({
    data: {
      briefId,
      versionNo,
      uploaderId: session.user.id,
      note: note ?? undefined,
      basedOnVersionId: basedOnVersionId ?? undefined,
    },
  });

  // Process and store images
  const imageRecords = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processAndStoreImage(
      buffer,
      file.name,
      file.type as Parameters<typeof processAndStoreImage>[2],
      briefId,
      version.id
    );
    const image = await prisma.image.create({
      data: { versionId: version.id, ...processed },
    });
    imageRecords.push(image);
  }

  // Update brief status to REVIEWING
  await prisma.brief.update({
    where: { id: briefId },
    data: { status: "REVIEWING" },
  });

  const fullVersion = await prisma.version.findUnique({
    where: { id: version.id },
    include: {
      uploader: { select: { id: true, name: true, avatar: true } },
      images: true,
      comments: true,
    },
  });

  return buildApiSuccess(fullVersion, 201);
}
