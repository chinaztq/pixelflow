"use client";

import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import type { Image } from "@prisma/client";

interface LightboxProps {
  images: Image[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between h-12 px-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
          {current.originalName}
          <span className="ml-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            {current.width} × {current.height} · {formatFileSize(current.size)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {index + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[6px]"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center px-12 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 flex items-center justify-center w-9 h-9 rounded-[6px]"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 flex items-center justify-center w-9 h-9 rounded-[6px]"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={`/api/images/${current.previewPath}`}
          alt={current.originalName}
          className="max-h-full max-w-full object-contain"
          style={{ maxHeight: "calc(100vh - 96px)" }}
        />
      </div>
    </div>
  );
}
