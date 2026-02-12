import type { FileStatus } from "./types";

export type StatusUi = {
  label: string;
  meaning: string;
  badge: { bgClass: string; dotClass: string };
};

export const STATUS_UI: Record<FileStatus, StatusUi> = {
  draft: {
    label: "Draft",
    meaning: "Local work in progress.",
    badge: { bgClass: "bg-badge-draft/15 text-badge-draft", dotClass: "bg-badge-draft" },
  },
  saved_local: {
    label: "Saved",
    meaning: "Saved locally and ready to push.",
    badge: { bgClass: "bg-badge-saved/15 text-badge-saved", dotClass: "bg-badge-saved" },
  },
  submitted: {
    label: "Pushed Dev",
    meaning: "Sent to the Dev environment (no leader approval).",
    badge: { bgClass: "bg-badge-submitted/15 text-badge-submitted", dotClass: "bg-badge-submitted" },
  },
  pending_approval: {
    label: "Pending Review",
    meaning: "Sent to Prod review; waiting Team Leader approval.",
    badge: { bgClass: "bg-badge-pending/15 text-badge-pending", dotClass: "bg-badge-pending" },
  },
  approved: {
    label: "Approved",
    meaning: "Approved and merged to main.",
    badge: { bgClass: "bg-badge-approved/15 text-badge-approved", dotClass: "bg-badge-approved" },
  },
};

export function getStatusUi(status: FileStatus): StatusUi {
  return STATUS_UI[status];
}

