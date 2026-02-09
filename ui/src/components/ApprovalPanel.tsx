"use client";

import { useEditorStore } from "@/lib/store";

export function ApprovalPanel() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const approveFile = useEditorStore((s) => s.approveFile);
  const rejectFile = useEditorStore((s) => s.rejectFile);

  const file = selectedFile ? files[selectedFile] : null;

  if (!selectedFile || !file || file.status !== "pending_approval") {
    return null;
  }

  const submittedAt = file.submittedAt
    ? new Date(file.submittedAt).toLocaleString()
    : null;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-surface border border-sidebar-border rounded-lg p-5 max-w-sm w-full shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-badge-pending"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className="text-sm font-semibold text-foreground">
            Pending Approval
          </h3>
        </div>

        <p className="text-xs text-text-secondary mb-1 leading-relaxed">
          This file has been submitted to production and needs approval before
          merging.
        </p>

        {submittedAt && (
          <p className="text-[10px] text-text-tertiary mb-4">
            Submitted {submittedAt}
          </p>
        )}

        {!submittedAt && <div className="mb-4" />}

        <div className="flex items-center gap-2">
          <button
            onClick={() => approveFile(selectedFile)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-white bg-badge-approved hover:bg-badge-approved/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-badge-approved/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Approve
          </button>
          <button
            onClick={() => rejectFile(selectedFile)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
