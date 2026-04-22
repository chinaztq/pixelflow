"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { BriefForm } from "@/components/brief/BriefForm";

interface NewBriefDialogProps {
  trigger?: React.ReactNode;
}

export function NewBriefDialog({ trigger }: NewBriefDialogProps) {
  const [open, setOpen] = useState(false);
  const [designers, setDesigners] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (open && designers.length === 0) {
      fetch("/api/designers")
        .then((r) => r.json())
        .then((d) => setDesigners(d.data ?? []));
    }
  }, [open, designers.length]);

  const handleSuccess = (briefId: string) => {
    setOpen(false);
    router.push(`/briefs/${briefId}`);
    router.refresh();
  };

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <button
            className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-sm font-semibold transition-all"
            style={{
              background: "#c96442",
              color: "#faf9f5",
              border: "1px solid #c96442",
              boxShadow: "0px 0px 0px 1px #c96442",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#b55a3a";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#c96442";
            }}
          >
            <Plus size={14} strokeWidth={2} />
            新建需求
          </button>
        )}
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-8 px-4"
          style={{ background: "rgba(20,20,19,0.5)", backdropFilter: "blur(2px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl rounded-[12px] border flex flex-col"
            style={{
              background: "#faf9f5",
              borderColor: "#e8e6dc",
              maxHeight: "calc(100vh - 80px)",
              boxShadow: "rgba(0,0,0,0.12) 0px 20px 60px, 0px 0px 0px 1px #e8e6dc",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 h-12 border-b shrink-0 rounded-t-[12px]"
              style={{ borderColor: "#e8e6dc", background: "#f5f4ed" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "#141413" }}>
                新建需求单
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-7 h-7 rounded-[8px] transition-all"
                style={{ color: "#87867f" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#141413";
                  (e.currentTarget as HTMLButtonElement).style.background = "#e8e6dc";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#87867f";
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <X size={15} strokeWidth={1.5} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <BriefForm designers={designers} onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
