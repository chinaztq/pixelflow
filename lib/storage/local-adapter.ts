import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import type { StorageAdapter } from "./index";

export class LocalStorageAdapter implements StorageAdapter {
  private root: string;

  constructor(root?: string) {
    this.root = root ?? process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");
    if (!existsSync(this.root)) mkdirSync(this.root, { recursive: true });
  }

  private abs(relativePath: string): string {
    return path.join(this.root, relativePath);
  }

  async save(file: Buffer, relativePath: string, _mimeType: string): Promise<string> {
    const abs = this.abs(relativePath);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, file);
    return relativePath;
  }

  async get(relativePath: string): Promise<Buffer> {
    return fs.readFile(this.abs(relativePath));
  }

  async delete(relativePath: string): Promise<void> {
    try {
      await fs.unlink(this.abs(relativePath));
    } catch {
      // ignore if already gone
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    return existsSync(this.abs(relativePath));
  }

  getUrl(relativePath: string): string {
    return `/api/images/${relativePath}`;
  }
}

export const storage = new LocalStorageAdapter();
