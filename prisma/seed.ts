import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

function createClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./data/pixelflow.db";
  const dbPath = dbUrl.replace(/^file:/, "");
  const absPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const adapter = new PrismaBetterSqlite3({ url: `file:${absPath}` });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@pixelflow.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123456";
  const adminName = process.env.ADMIN_NAME ?? "Admin";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, name: adminName, password: hashed, role: Role.ADMIN },
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  const requesterEmail = "requester@pixelflow.com";
  const designerEmail = "designer@pixelflow.com";
  const devPassword = await bcrypt.hash("Test123456", 12);

  const r = await prisma.user.findUnique({ where: { email: requesterEmail } });
  if (!r) {
    await prisma.user.create({
      data: { email: requesterEmail, name: "测试投手", password: devPassword, role: Role.REQUESTER },
    });
    console.log(`Requester created: ${requesterEmail}`);
  }

  const d = await prisma.user.findUnique({ where: { email: designerEmail } });
  if (!d) {
    await prisma.user.create({
      data: { email: designerEmail, name: "测试设计师", password: devPassword, role: Role.DESIGNER },
    });
    console.log(`Designer created: ${designerEmail}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
