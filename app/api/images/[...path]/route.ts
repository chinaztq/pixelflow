import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage/local-adapter";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "请先登录" } }, { status: 401 });
  }

  const { path } = await params;
  const relativePath = path.join("/");
  const { searchParams } = request.nextUrl;
  const size = searchParams.get("size") ?? "original"; // thumb | preview | original

  // Build actual path based on size param
  let actualPath = relativePath;
  if (size === "thumb" && !relativePath.includes("/thumbnail/")) {
    actualPath = relativePath.replace("/original/", "/thumbnail/").replace("/preview/", "/thumbnail/");
  } else if (size === "preview" && !relativePath.includes("/preview/")) {
    actualPath = relativePath.replace("/original/", "/preview/").replace("/thumbnail/", "/preview/");
  }

  // Check template images first (templates/{id}/...)
  if (relativePath.startsWith("templates/")) {
    const template = await prisma.template.findFirst({
      where: {
        OR: [
          { filePath: actualPath },
          { thumbnailPath: actualPath },
          { previewPath: actualPath },
          { filePath: relativePath },
          { thumbnailPath: relativePath },
          { previewPath: relativePath },
        ],
      },
    });
    if (!template) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "图片不存在" } }, { status: 404 });
    }

    const fileToServe = size === "thumb"
      ? template.thumbnailPath
      : size === "preview"
      ? template.previewPath
      : template.filePath;

    const buf = await storage.get(fileToServe).catch(() => null);
    if (!buf) return NextResponse.json({ error: { code: "NOT_FOUND", message: "文件不存在" } }, { status: 404 });

    const ext = fileToServe.split(".").pop() ?? "jpg";
    const mimeType = MIME_TYPES[ext] ?? "image/jpeg";

    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  // Verify image exists in DB and check permissions
  const image = await prisma.image.findFirst({
    where: {
      OR: [
        { filePath: actualPath },
        { thumbnailPath: actualPath },
        { previewPath: actualPath },
        { filePath: relativePath },
        { thumbnailPath: relativePath },
        { previewPath: relativePath },
      ],
    },
    include: {
      version: {
        include: { brief: true },
      },
    },
  });

  // Also check reference images
  if (!image) {
    const ref = await prisma.referenceImage.findFirst({
      where: { OR: [{ filePath: relativePath }, { thumbnailPath: relativePath }] },
      include: { brief: true },
    });
    if (!ref) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "图片不存在" } }, { status: 404 });
    }

    const buf = await storage.get(relativePath).catch(() => null);
    if (!buf) return NextResponse.json({ error: { code: "NOT_FOUND", message: "文件不存在" } }, { status: 404 });

    const ext = relativePath.split(".").pop() ?? "jpg";
    const mimeType = MIME_TYPES[ext] ?? "image/jpeg";
    return new NextResponse(buf as unknown as BodyInit, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const fileToServe = size === "thumb"
    ? image.thumbnailPath
    : size === "preview"
    ? image.previewPath
    : image.filePath;

  const buf = await storage.get(fileToServe).catch(() => null);
  if (!buf) return NextResponse.json({ error: { code: "NOT_FOUND", message: "文件不存在" } }, { status: 404 });

  const ext = fileToServe.split(".").pop() ?? "jpg";
  const mimeType = MIME_TYPES[ext] ?? "image/jpeg";

  const isAdopted = image.isArchived;
  const cacheControl = isAdopted
    ? "private, max-age=86400, stale-while-revalidate=604800"
    : "private, max-age=3600";

  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": cacheControl,
    },
  });
}
