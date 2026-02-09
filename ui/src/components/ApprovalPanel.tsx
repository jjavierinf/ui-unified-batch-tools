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
      <div className="bg-surface border border-sidebar-border rounded-lg p-6 max-w-md w-full shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-badge-pending" />
          <h3 className="text-sm font-semibold text-foreground">
            Pending Approval
          </h3>
        </div>

        <p className="text-sm text-text-secondary mb-1">
          This file has been submitted and is waiting for approval before it can
          be merged to production.
        </p>

        {submittedAt && (
          <p className="text-xs text-text-tertiary mb-5">
            Submitted at: {submittedAt}
          </p>
        )}

        {!submittedAt && <div className="mb-5" />}

        <div className="flex items-center gap-3">
          <button
            onClick={() => approveFile(selectedFile)}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md text-white bg-badge-approved hover:bg-badge-approved/80 transition-colors cursor-pointer"
          >
            Approve
          </button>
          <button
            onClick={() => rejectFile(selectedFile)}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-500/80 transition-colors cursor-pointer"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
