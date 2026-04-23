"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { RelativeTime } from "@/components/common/RelativeTime";
import { StatusBadge, PriorityBadge, VersionStatusBadge } from "@/components/common/StatusBadge";
import { UploadPanel } from "@/components/version/UploadPanel";
import { Lightbox } from "@/components/image/Lightbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Plus, Check, X, Star } from "lucide-react";
import { canUploadVersion, canAssignBrief } from "@/lib/permissions";
import type { SessionUser, BriefWithRelations } from "@/types";

interface BriefDetailProps {
  brief: BriefWithRelations;
  currentUser: SessionUser;
  designers: { id: string; name: string }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.data);

export function BriefDetail({ brief: initialBrief, currentUser }: BriefDetailProps) {
  const { data: brief, mutate } = useSWR<BriefWithRelations>(
    `/api/briefs/${initialBrief.id}`,
    fetcher,
    { fallbackData: initialBrief, refreshInterval: 0 }
  );

  const [showUpload, setShowUpload] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; versionId: string } | null>(null);
  const [adoptDialog, setAdoptDialog] = useState<{ open: boolean; versionId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [lightbox, setLightbox] = useState<{ images: typeof initialBrief.versions[0]["images"]; index: number } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (!brief) return null;

  const canUpload = canUploadVersion(currentUser, brief);
  const canAssign = canAssignBrief(currentUser, brief);

  async function handleAssign() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/briefs/${brief!.id}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) { toast.error("接单失败"); return; }
      toast.success("接单成功");
      mutate();
    } finally { setActionLoading(false); }
  }

  async function handleApprove(versionId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/versions/${versionId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) { toast.error("操作失败"); return; }
      toast.success("已通过");
      mutate();
    } finally { setActionLoading(false); }
  }

  async function handleReject() {
    if (!rejectDialog || !rejectReason.trim()) { toast.error("请填写反馈意见"); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/versions/${rejectDialog.versionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) { toast.error("操作失败"); return; }
      toast.success("已打回，等待设计师修改");
      setRejectDialog(null);
      setRejectReason("");
      mutate();
    } finally { setActionLoading(false); }
  }

  async function handleAdopt() {
    if (!adoptDialog) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/versions/${adoptDialog.versionId}/adopt`, { method: "POST" });
      if (!res.ok) { toast.error("操作失败"); return; }
      toast.success("已采用，素材已归档");
      setAdoptDialog(null);
      mutate();
    } finally { setActionLoading(false); }
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Left panel — brief info */}
      <div
        className="w-[360px] shrink-0 space-y-4"
        style={{ position: "sticky", top: 0, alignSelf: "flex-start" }}
      >
        <Link
          href="/briefs"
          className="inline-flex items-center gap-1 text-sm hover:text-[var(--accent)] transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
          返回列表
        </Link>

        <div
          className="rounded-[6px] border p-4 space-y-3"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
              {brief.title}
            </h1>
            <StatusBadge status={brief.status} />
          </div>

          <div className="flex items-center gap-2">
            <PriorityBadge priority={brief.priority} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{brief.channel}</span>
          </div>

          <div className="text-xs space-y-1.5" style={{ color: "var(--text-muted)" }}>
            {brief.specs && <p><span style={{ color: "var(--text-subtle)" }}>规格：</span>{brief.specs}</p>}
            {brief.audience && <p><span style={{ color: "var(--text-subtle)" }}>受众：</span>{brief.audience}</p>}
            {brief.product && <p><span style={{ color: "var(--text-subtle)" }}>产品：</span>{brief.product}</p>}
            {brief.deadline && <p><span style={{ color: "var(--text-subtle)" }}>截止：</span>{formatDate(brief.deadline)}</p>}
          </div>

          <div className="pt-2 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <p className="whitespace-pre-wrap leading-relaxed">{brief.description}</p>
          </div>

          <div className="pt-2 border-t text-xs space-y-1.5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-subtle)" }}>发起人</span>
              <span style={{ color: "var(--text-muted)" }}>{brief.requester.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-subtle)" }}>设计师</span>
              <span style={{ color: "var(--text-muted)" }}>{brief.assignee?.name ?? "未指派"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "var(--text-subtle)" }}>创建时间</span>
              <span style={{ color: "var(--text-muted)" }}><RelativeTime date={brief.createdAt} /></span>
            </div>
          </div>

          {/* Actions */}
          {canAssign && (
            <button
              onClick={handleAssign}
              disabled={actionLoading}
              className="w-full h-8 rounded-[6px] text-sm font-semibold transition-colors"
              style={{ background: "#c96442", color: "#faf9f5", border: "1px solid #c96442" }}
            >
              接单
            </button>
          )}
        </div>

        {/* Reference images */}
        {brief.references.length > 0 && (
          <div
            className="rounded-[6px] border p-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>参考图</p>
            <div className="flex flex-wrap gap-3">
              {brief.references.map((ref) => (
                <div
                  key={ref.id}
                  className="w-[300px] rounded-[6px] overflow-hidden bg-[#f5f4ed]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/images/${ref.thumbnailPath}?size=thumb`}
                    alt={ref.originalName}
                    className="w-[300px] h-auto block"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right panel — versions timeline */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium" style={{ color: "var(--text)" }}>
            版本记录
            {brief.versions.length > 0 && (
              <span className="ml-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {brief.versions.length} 个版本
              </span>
            )}
          </h2>
          {canUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-sm font-semibold transition-colors"
              style={{ background: "#c96442", color: "#faf9f5", border: "1px solid #c96442" }}
            >
              <Plus size={14} strokeWidth={2} />
              上传新版本
            </button>
          )}
        </div>

        {brief.versions.length === 0 && (
          <div
            className="rounded-[6px] border p-8 text-center"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {brief.status === "PENDING" ? "等待设计师接单" : "设计师还未上传版本"}
            </p>
          </div>
        )}

        {brief.versions.map((version) => {
          const canReviewThis = version.status === "PENDING_REVIEW" && brief.status !== "COMPLETED";

          return (
            <div
              key={version.id}
              className="rounded-[6px] border overflow-hidden"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* Version header */}
              <div
                className="flex items-center justify-between px-4 h-10 border-b"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-[6px]"
                    style={{ background: "var(--hover-bg)", color: "var(--text-muted)" }}
                  >
                    v{version.versionNo}
                  </span>
                  <VersionStatusBadge status={version.status} />
                  <div className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={version.uploader.avatar ?? undefined} />
                      <AvatarFallback className="text-[9px]">
                        {(version.uploader.name ?? "?").slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {version.uploader.name}
                    </span>
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
                  <RelativeTime date={version.createdAt} />
                </span>
              </div>

              {/* Note */}
              {version.note && (
                <div
                  className="px-4 py-2 text-xs border-b"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  {version.note}
                </div>
              )}

              {/* Image grid */}
              {version.images.length > 0 && (
                <div className="p-3 flex flex-wrap gap-3">
                  {version.images.map((img, idx) => (
                    <button
                      key={img.id}
                      className="w-[300px] rounded-[6px] overflow-hidden bg-[#f5f4ed] hover:opacity-90 transition-opacity"
                      onClick={() => setLightbox({ images: version.images, index: idx })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/images/${img.thumbnailPath}`}
                        alt={img.originalName}
                        className="w-[300px] h-auto block"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Comments */}
              {version.comments.length > 0 && (
                <div className="px-4 pb-3 space-y-2">
                  {version.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 text-xs">
                      <Avatar className="w-5 h-5 shrink-0 mt-0.5">
                        <AvatarFallback className="text-[9px]">
                          {(comment.author.name ?? "?").slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium" style={{ color: "var(--text)" }}>
                          {comment.author.name}
                        </span>
                        <span className="mx-1" style={{ color: "var(--text-subtle)" }}>·</span>
                        <span style={{ color: "var(--text-subtle)" }}>
                          <RelativeTime date={comment.createdAt} />
                        </span>
                        {comment.type === "FEEDBACK" && (
                          <span
                            className="ml-1.5 px-1 rounded-[3px] text-[10px] font-medium"
                            style={{ background: "#fdf1f1", color: "#b53333", border: "1px solid #f5c5c5" }}
                          >
                            反馈
                          </span>
                        )}
                        <p className="mt-0.5 leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {canReviewThis && (
                <div
                  className="flex items-center gap-2 px-4 py-3 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    onClick={() => setAdoptDialog({ open: true, versionId: version.id })}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-sm font-semibold text-white transition-colors"
                    style={{ background: "#3a6b44", color: "#faf9f5", border: "1px solid #3a6b44" }}
                  >
                    <Star size={13} strokeWidth={1.5} />
                    采用此版本
                  </button>
                  <button
                    onClick={() => handleApprove(version.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-sm border transition-colors"
                    style={{ borderColor: "#e8e6dc", color: "#5e5d59", background: "transparent" }}
                  >
                    <Check size={13} strokeWidth={1.5} />
                    通过
                  </button>
                  <button
                    onClick={() => { setRejectDialog({ open: true, versionId: version.id }); setRejectReason(""); }}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-sm border transition-colors"
                    style={{ borderColor: "#e8e6dc", color: "#5e5d59", background: "transparent" }}
                  >
                    <X size={13} strokeWidth={1.5} />
                    打回修改
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload panel */}
      {showUpload && (
        <UploadPanel
          briefId={brief.id}
          versions={brief.versions}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); mutate(); }}
        />
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog?.open} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent className="rounded-[6px]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <DialogHeader>
            <DialogTitle className="text-sm font-medium" style={{ color: "var(--text)" }}>
              打回修改
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请填写具体的修改意见，帮助设计师改进..."
            rows={4}
            className="rounded-[6px] text-sm resize-none"
            style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text)" }}
          />
          <DialogFooter>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="h-8 px-4 rounded-[6px] text-sm font-semibold text-white"
              style={{ background: "#b53333", color: "#faf9f5", border: "1px solid #b53333" }}
            >
              确认打回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adopt dialog */}
      <Dialog open={!!adoptDialog?.open} onOpenChange={() => setAdoptDialog(null)}>
        <DialogContent className="rounded-[6px]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <DialogHeader>
            <DialogTitle className="text-sm font-medium" style={{ color: "var(--text)" }}>
              采用此版本
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            采用后需求单将标记为已完成，图片自动归入素材库，且不可再上传新版本。确认操作？
          </p>
          <DialogFooter>
            <Button
              onClick={handleAdopt}
              disabled={actionLoading}
              className="h-8 px-4 rounded-[6px] text-sm font-semibold text-white"
              style={{ background: "#3a6b44", color: "#faf9f5", border: "1px solid #3a6b44" }}
            >
              确认采用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
