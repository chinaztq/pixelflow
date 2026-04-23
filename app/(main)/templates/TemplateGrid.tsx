"use client";

import { useState, useRef, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Upload, Trash2, Edit3, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/common/RelativeTime";
import { EmptyState } from "@/components/common/EmptyState";
import type { Template, User } from "@prisma/client";

type TemplateWithUploader = Template & {
  uploader: Pick<User, "id" | "name" | "avatar">;
};

interface TemplateGridProps {
  initialTemplates: TemplateWithUploader[];
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file.type || !ALLOWED_TYPES.includes(file.type)) return { valid: false, error: "格式不支持" };
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: "超过20MB" };
  return { valid: true };
}

export function TemplateGrid({ initialTemplates }: TemplateGridProps) {
  const { data: templates, mutate } = useSWR<TemplateWithUploader[]>(
    "/api/templates",
    (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data),
    { fallbackData: initialTemplates }
  );

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNote, setEditNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      try {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        const res = await fetch("/api/templates", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) { toast.error(json.error?.message ?? "上传失败"); return; }
        toast.success(`已上传 ${files.length} 个模板`);
        mutate();
      } finally {
        setUploading(false);
      }
    },
    [mutate]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => validateFile(f).valid);
      if (files.length === 0) return;
      await uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => validateFile(f).valid);
    if (files.length === 0) return;
    e.target.value = "";
    await uploadFiles(files);
  };

  async function handleDelete(id: string) {
    if (!confirm("确定删除此模板？")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("删除失败"); return; }
    toast.success("已删除");
    mutate();
  }

  async function handleSaveEdit(id: string) {
    const res = await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, note: editNote }),
    });
    if (!res.ok) { toast.error("保存失败"); return; }
    toast.success("已保存");
    setEditingId(null);
    mutate();
  }

  function startEdit(t: TemplateWithUploader) {
    setEditingId(t.id);
    setEditTitle(t.title ?? "");
    setEditNote(t.note ?? "");
  }

  if (!templates) return null;

  return (
    <div className="space-y-4">
      {/* Upload drop zone */}
      <div
        className="border-2 border-dashed rounded-[6px] p-5 text-center cursor-pointer transition-colors"
        style={{
          borderColor: dragOver ? "var(--accent)" : "var(--border)",
          background: dragOver ? "var(--hover-bg)" : undefined,
        }}
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        <Upload size={20} className="mx-auto mb-2" strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {uploading ? "上传中..." : "拖拽图片到此处，或点击选择上传模板"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
          JPG / PNG / WebP，单张 ≤ 20MB
        </p>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileSelect} />
      </div>

      {templates.length === 0 ? (
        <EmptyState title="暂无模板" description="拖拽或点击上方区域上传图片模板" />
      ) : (
        <div className="flex flex-wrap gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="w-[300px] rounded-[6px] border overflow-hidden"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* Image */}
              <div className="relative bg-[#f5f4ed]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/images/${t.thumbnailPath}`}
                  alt={t.originalName}
                  className="w-[300px] h-auto block"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {/* Actions overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => startEdit(t)}
                    className="w-7 h-7 flex items-center justify-center rounded-[4px] transition-colors"
                    style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
                    title="编辑"
                  >
                    <Edit3 size={12} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-[4px] transition-colors"
                    style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
                    title="删除"
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                {editingId === t.id ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="模板标题（可选）"
                      className="w-full h-7 px-2 rounded-[4px] border text-xs"
                      style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text)" }}
                    />
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="添加备注..."
                      rows={2}
                      className="w-full px-2 py-1 rounded-[4px] border text-xs resize-none"
                      style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text)" }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(t.id)}
                        className="flex items-center gap-1 h-6 px-2 rounded-[4px] text-xs font-medium"
                        style={{ background: "#c96442", color: "#faf9f5" }}
                      >
                        <Check size={10} strokeWidth={1.5} />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-6 px-2 rounded-[4px] text-xs border"
                        style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {t.title && (
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                        {t.title}
                      </p>
                    )}
                    {t.note && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {t.note}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={t.uploader.avatar ?? undefined} />
                        <AvatarFallback className="text-[9px]">
                          {(t.uploader.name ?? "?").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                        {t.uploader.name}
                      </span>
                      <span className="text-xs ml-auto" style={{ color: "var(--text-subtle)" }}>
                        <RelativeTime date={t.createdAt} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
