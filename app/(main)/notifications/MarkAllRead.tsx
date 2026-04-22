"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MarkAllRead() {
  const router = useRouter();

  const handleClick = async () => {
    const res = await fetch("/api/notifications/read-all", { method: "POST" });
    if (res.ok) {
      toast.success("已全部标记为已读");
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-xs hover:underline"
      style={{ color: "var(--accent)" }}
    >
      全部已读
    </button>
  );
}
