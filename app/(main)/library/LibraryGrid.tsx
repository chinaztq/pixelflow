"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Download } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import type { Image, Tag, Version, Brief } from "@prisma/client";

type LibraryImage = Image & {
  tags: Tag[];
  version: Version & { brief: Pick<Brief, "id" | "title" | "channel"> };
};

interface LibraryGridProps {
  initialImages: LibraryImage[];
  channels: string[];
}

export function LibraryGrid({ initialImages, channels }: LibraryGridProps) {
  const [filterChannel, setFilterChannel] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);

  const images = filterChannel
    ? initialImages.filter((img) => img.version.brief.channel === filterChannel)
    : initialImages;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="h-8 px-2.5 rounded-[6px] border text-sm"
          style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text)", minWidth: 110 }}
        >
          <option value="">全部渠道</option>
          {channels.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
          {images.length} 张素材
        </span>
      </div>

      {images.length === 0 ? (
        <EmptyState title="暂无素材" description="采用需求单版本后，图片将自动归入素材库" />
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative w-[300px] rounded-[6px] overflow-hidden border group cursor-pointer"
              style={{ borderColor: "var(--border)" }}
              onMouseEnter={() => setHovered(img.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${img.thumbnailPath}`}
                alt={img.originalName}
                className="w-[300px] h-auto block"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.background = "var(--hover-bg)";
                }}
              />

              {/* Hover overlay */}
              {hovered === img.id && (
                <div
                  className="absolute inset-0 flex flex-col justify-end p-2"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }}
                >
                  <p className="text-white text-xs font-medium truncate leading-tight">
                    {img.version.brief.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {formatDate(img.createdAt)}
                    </span>
                    <a
                      href={`/api/images/${img.filePath}?size=original`}
                      download={img.originalName}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center w-6 h-6 rounded-[4px]"
                      style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                    >
                      <Download size={12} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
