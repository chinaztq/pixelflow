"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Upload, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface UploadPanelProps {
  briefId: string;
  versions: Array<{ id: string; versionNo: number; status: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface FileWithPreview {
  file: File;
  preview: string;
  valid: boolean;
  error?: string;
}

export function UploadPanel({
  briefId,
  versions,
  onClose,
  onSuccess,
}: UploadPanelProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [note, setNote] = useState("");
  const [basedOnVersionId, setBasedOnVersionId] = useState(() => {
    const rejected = versions.filter((v) => v.status === "REJECTED");
    if (rejected.length > 0) {
      const latest = rejected.reduce((a, b) =>
        a.versionNo > b.versionNo ? a : b
      );
      return latest.id;
    }
    return "";
  });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: "格式不支持" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: "超过20MB" };
    }
    return { valid: true };
  };

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const picked = Array.from(fileList).slice(
        0,
        MAX_FILES - files.length
      );
      if (picked.length === 0) {
        toast.error(`最多选择 ${MAX_FILES} 张图片`);
        return;
      }
      const newFiles: FileWithPreview[] = picked.map((file) => {
        const { valid, error } = validateFile(file);
        return {
          file,
          preview: URL.createObjectURL(file),
          valid,
          error,
        };
      });
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length]
  );

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (i: number) => {
    setFiles((prev) => {
      const f = prev[i];
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleSubmit = async () => {
    const validFiles = files.filter((f) => f.valid);
    if (validFiles.length === 0) {
      toast.error("请选择有效的图片文件");
      return;
    }
    if (files.some((f) => !f.valid)) {
      toast.error("请移除标记为无效的文件");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      validFiles.forEach((f) => fd.append("files", f.file));
      if (note.trim()) fd.append("note", note.trim());
      if (basedOnVersionId) fd.append("basedOnVersionId", basedOnVersionId);

      const res = await fetch(`/api/briefs/${briefId}/versions`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "上传失败");
        return;
      }
      toast.success(`v${json.data.versionNo} 已上传`);
      onSuccess();
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validCount = files.filter((f) => f.valid).length;
  const invalidCount = files.length - validCount;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-xl rounded-[6px]"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            上传新版本
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {versions.length > 0 && (
            <div className="space-y-1.5">
              <label
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                基于哪个版本修改（可选）
              </label>
              <select
                value={basedOnVersionId}
                onChange={(e) => setBasedOnVersionId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-[6px] border text-sm"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--card)",
                  color: "var(--text)",
                }}
              >
                <option value="">全新版本</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNo}
                    {v.status === "REJECTED" ? "（已打回）" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              版本说明（可选）
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="简述本次修改内容..."
              rows={2}
              className="rounded-[6px] text-sm resize-none"
              style={{
                borderColor: "var(--border)",
                background: "var(--card)",
                color: "var(--text)",
              }}
            />
          </div>

          <div
            className="border-2 border-dashed rounded-[6px] p-6 text-center cursor-pointer transition-colors"
            style={{
              borderColor: dragOver
                ? "var(--accent)"
                : "var(--border)",
              background: dragOver
                ? "var(--hover-bg)"
                : undefined,
            }}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload
              size={20}
              className="mx-auto mb-2"
              strokeWidth={1.5}
              style={{ color: "var(--text-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              拖拽图片到此处，或点击选择
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-subtle)" }}
            >
              JPG / PNG / WebP，单张 ≤ 20MB，最多 {MAX_FILES} 张
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {files.map((f, i) => (
                <div
                  key={f.preview}
                  className="relative w-[300px] rounded-[6px] overflow-hidden border"
                  style={{
                    borderColor: f.valid
                      ? "var(--border)"
                      : "#f87171",
                  }}
                >
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    className={`w-[300px] h-auto block ${
                      f.valid ? "" : "opacity-50"
                    }`}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-[10px] text-white truncate">
                      {f.file.name}
                    </p>
                    <p className="text-[10px] text-white/80">
                      {(f.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  {!f.valid && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-red-500/90 text-white text-[10px]">
                        <AlertCircle size={10} />
                        {f.error}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X size={10} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div
              className="flex items-center justify-between text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                共 {files.length} 个文件
                {invalidCount > 0
                  ? `，${invalidCount} 个无效`
                  : ""}
              </span>
              {validCount > 0 && (
                <span>可提交 {validCount} 个</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={uploading || validCount === 0}
            className="h-8 px-4 rounded-[6px] text-sm font-medium"
            style={{
              background: "#c96442",
              color: "#faf9f5",
              border: "1px solid #c96442",
            }}
          >
            {uploading
              ? "上传中..."
              : `提交版本 (${validCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
