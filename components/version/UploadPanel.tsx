"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface UploadPanelProps {
  briefId: string;
  versions: Array<{ id: string; versionNo: number }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadPanel({ briefId, versions, onClose, onSuccess }: UploadPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [basedOnVersionId, setBasedOnVersionId] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
    e.target.value = "";
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (files.length === 0) { toast.error("请选择图片"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      if (note.trim()) fd.append("note", note.trim());
      if (basedOnVersionId) fd.append("basedOnVersionId", basedOnVersionId);

      const res = await fetch(`/api/briefs/${briefId}/versions`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error?.message ?? "上传失败"); return; }
      toast.success(`v${json.data.versionNo} 已上传`);
      onSuccess();
    } finally { setUploading(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg rounded-[8px]"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-medium" style={{ color: "var(--text)" }}>
            上传新版本
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Based on */}
          {versions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                基于哪个版本修改（可选）
              </label>
              <select
                value={basedOnVersionId}
                onChange={(e) => setBasedOnVersionId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-[8px] border text-sm"
                style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text)" }}
              >
                <option value="">全新版本</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>v{v.versionNo} 的修改</option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>版本说明（可选）</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="简述本次修改内容..."
              rows={2}
              className="rounded-[8px] text-sm resize-none"
              style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text)" }}
            />
          </div>

          {/* File drop zone */}
          <div
            className="border-2 border-dashed rounded-[8px] p-4 text-center cursor-pointer transition-colors hover:bg-[var(--hover-bg)]"
            style={{ borderColor: "var(--border)" }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} className="mx-auto mb-1" strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>点击选择图片（最多10张）</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
              JPG / PNG / WebP，≤ 20MB
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
            <div className="flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 h-6 px-2 rounded-[8px] border text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--card)" }}
                >
                  {f.name.length > 18 ? f.name.slice(0, 18) + "…" : f.name}
                  <button type="button" onClick={() => removeFile(i)}>
                    <X size={11} strokeWidth={1.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={uploading || files.length === 0}
            className="h-8 px-4 rounded-[8px] text-sm font-semibold"
            style={{ background: "#c96442", color: "#faf9f5", border: "1px solid #c96442" }}
          >
            {uploading ? <Loader size={14} className="animate-spin" /> : "提交版本"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
