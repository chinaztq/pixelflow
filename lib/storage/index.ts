export interface StorageAdapter {
  save(file: Buffer, relativePath: string, mimeType: string): Promise<string>;
  get(relativePath: string): Promise<Buffer>;
  delete(relativePath: string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  getUrl(relativePath: string): string;
}
