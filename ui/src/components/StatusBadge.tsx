"use client";

import { FileStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: FileStatus;
}

const config: Record<
  FileStatus,
  { label: string; bgClass: string; dotClass: string }
> = {
  draft: {
    label: "Draft",
    bgClass: "bg-badge-draft/15 text-badge-draft",
    dotClass: "bg-badge-draft",
  },
  submitted: {
    label: "Submitted",
    bgClass: "bg-badge-submitted/15 text-badge-submitted",
    dotClass: "bg-badge-submitted",
  },
  pending_approval: {
    label: "Pending",
    bgClass: "bg-badge-pending/15 text-badge-pending",
    dotClass: "bg-badge-pending",
  },
  approved: {
    label: "Approved",
    bgClass: "bg-badge-approved/15 text-badge-approved",
    dotClass: "bg-badge-approved",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bgClass, dotClass } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
