"use client";

import { FileStatus } from "@/lib/types";
import { getStatusUi } from "@/lib/status-ui";

interface StatusBadgeProps {
  status: FileStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const ui = getStatusUi(status);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${ui.badge.bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ui.badge.dotClass}`} />
      {ui.label}
    </span>
  );
}
