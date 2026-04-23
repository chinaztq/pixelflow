import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { storage } from "@/lib/storage/local-adapter";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB ?? "20") * 1024 * 1024;
const MAX_FILES = parseInt(process.env.MAX_FILES_PER_UPLOAD ?? "10");

export { MAX_FILE_SIZE, MAX_FILES };

interface ProcessedImage {
  filename: string;
  originalName: string;
  filePath: string;
  thumbnailPath: string;
  previewPath: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export async function processAndStoreImage(
  buffer: Buffer,
  originalName: string,
  mimeType: AllowedMimeType,
  briefId: string,
  versionId: string
): Promise<ProcessedImage> {
  const filename = uuidv4();
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const base = `briefs/${briefId}/versions/${versionId}`;

  const originalPath = `${base}/original/${filename}.${ext}`;
  const previewPath = `${base}/preview/${filename}.${ext}`;
  const thumbnailPath = `${base}/thumbnail/${filename}.${ext}`;

  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Original
  await storage.save(buffer, originalPath, mimeType);

  // Preview (max long-side 1200px)
  const previewBuf = await image
    .clone()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  await storage.save(previewBuf, previewPath, mimeType);

  // Thumbnail (max long-side 400px)
  const thumbBuf = await image
    .clone()
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  await storage.save(thumbBuf, thumbnailPath, mimeType);

  return {
    filename,
    originalName,
    filePath: originalPath,
    thumbnailPath,
    previewPath,
    mimeType,
    size: buffer.length,
    width,
    height,
  };
}

export async function processAndStoreReference(
  buffer: Buffer,
  originalName: string,
  mimeType: AllowedMimeType,
  briefId: string
): Promise<{ filePath: string; thumbnailPath: string; originalName: string }> {
  const filename = uuidv4();
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const base = `briefs/${briefId}/references`;

  const filePath = `${base}/${filename}.${ext}`;
  const thumbnailPath = `${base}/thumb_${filename}.${ext}`;

  await storage.save(buffer, filePath, mimeType);

  const thumbBuf = await sharp(buffer)
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  await storage.save(thumbBuf, thumbnailPath, mimeType);

  return { filePath, thumbnailPath, originalName };
}

interface ProcessedTemplate {
  filename: string;
  originalName: string;
  filePath: string;
  thumbnailPath: string;
  previewPath: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export async function processAndStoreTemplate(
  buffer: Buffer,
  originalName: string,
  mimeType: AllowedMimeType,
  templateId: string
): Promise<ProcessedTemplate> {
  const filename = uuidv4();
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const base = `templates/${templateId}`;

  const originalPath = `${base}/original/${filename}.${ext}`;
  const previewPath = `${base}/preview/${filename}.${ext}`;
  const thumbnailPath = `${base}/thumbnail/${filename}.${ext}`;

  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Original
  await storage.save(buffer, originalPath, mimeType);

  // Preview (max long-side 1200px)
  const previewBuf = await image
    .clone()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  await storage.save(previewBuf, previewPath, mimeType);

  // Thumbnail (max long-side 400px)
  const thumbBuf = await image
    .clone()
    .resize(400, 400, { fit: "inside", withoutEnlargement: true })
    .toBuffer();
  await storage.save(thumbBuf, thumbnailPath, mimeType);

  return {
    filename,
    originalName,
    filePath: originalPath,
    thumbnailPath,
    previewPath,
    mimeType,
    size: buffer.length,
    width,
    height,
  };
}
