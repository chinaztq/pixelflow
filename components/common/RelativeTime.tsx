"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime, formatDate } from "@/lib/utils";

/**
 * Renders relative time only on the client to avoid SSR/hydration mismatch
 * (formatRelativeTime depends on Date.now() which differs between server and client render).
 * Shows a static date string on first render, then updates to relative time after mount.
 */
export function RelativeTime({
  date,
  className,
  style,
}: {
  date: Date | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [label, setLabel] = useState(() => formatDate(date));

  useEffect(() => {
    setLabel(formatRelativeTime(date));
  }, [date]);

  return (
    <span className={className} style={style} suppressHydrationWarning>
      {label}
    </span>
  );
}
