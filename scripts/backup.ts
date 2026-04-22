import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "pixelflow.db");
const BACKUP_DIR = path.join(process.cwd(), "backups");

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(BACKUP_DIR, `pixelflow-${timestamp}.db`);

fs.copyFileSync(DB_PATH, dest);
console.log(`Backup created: ${dest}`);

// Keep only last 30 backups
const files = fs
  .readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith("pixelflow-") && f.endsWith(".db"))
  .sort();

if (files.length > 30) {
  const toDelete = files.slice(0, files.length - 30);
  for (const f of toDelete) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
    console.log(`Removed old backup: ${f}`);
  }
}
