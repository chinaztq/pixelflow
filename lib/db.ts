import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";

// Bump this when schema changes to invalidate the cached PrismaClient instance
const SCHEMA_VERSION = 2;

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./data/pixelflow.db";
  const dbPath = dbUrl.replace(/^file:/, "");
  const absPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const adapter = new PrismaBetterSqlite3({ url: `file:${absPath}` });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: number | undefined;
};

export const prisma =
  globalForPrisma.prismaSchemaVersion === SCHEMA_VERSION && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
}
