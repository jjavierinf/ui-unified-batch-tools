"use client";

import { FileStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: FileStatus;
}

const config: Record<
  FileStatus,
  { label: string; bgClass: string }
> = {
  draft: { label: "Draft", bgClass: "bg-badge-draft" },
  submitted: { label: "Submitted", bgClass: "bg-badge-submitted" },
  pending_approval: { label: "Pending", bgClass: "bg-badge-pending" },
  approved: { label: "Approved", bgClass: "bg-badge-approved" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bgClass } = config[status];

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full text-white font-medium ${bgClass}`}
    >
      {label}
    </span>
  );
}
