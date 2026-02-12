"use client";

import type { SqlFile } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { getStatusUi } from "@/lib/status-ui";

interface Candidate {
  path: string;
  file: SqlFile;
}

export function PushProdConfirmModal({
  candidates,
  onCancel,
  onConfirm,
}: {
  candidates: Candidate[];
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg border border-sidebar-border bg-surface shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Send to review (Prod)
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              This will create a pending review. A Team Leader must approve it.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            title="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
            Summary ({candidates.length} file{candidates.length === 1 ? "" : "s"})
          </div>

          <div className="mt-2 border border-sidebar-border rounded-md overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_120px_90px] gap-2 px-3 py-2 bg-surface-hover/40 text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
              <span>Path</span>
              <span>Current</span>
              <span>Next</span>
              <span className="text-right">Diff</span>
            </div>
            <div className="max-h-[280px] overflow-auto bg-background">
              {candidates.map(({ path, file }) => {
                const hasDiff = file.content !== file.savedContent;
                const diffLabel = hasDiff ? "Uncommitted changes" : "Ready";
                return (
                  <div
                    key={path}
                    className="grid grid-cols-[1fr_120px_120px_90px] gap-2 px-3 py-2 border-t border-sidebar-border/60 text-xs items-center"
                  >
                    <span className="truncate text-foreground" title={path}>
                      {path}
                    </span>
                    <span className="text-text-secondary" title={getStatusUi(file.status).meaning}>
                      <StatusBadge status={file.status} />
                    </span>
                    <span className="text-text-secondary" title={getStatusUi("pending_approval").meaning}>
                      <StatusBadge status="pending_approval" />
                    </span>
                    <span className="text-right text-text-secondary" title={diffLabel}>
                      {diffLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 rounded-md border border-sidebar-border bg-background px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
              What happens now
            </div>
            <ul className="mt-1 text-[11px] text-text-secondary list-disc pl-5 space-y-1">
              <li>
                Files move to <span className="inline-block align-middle"><StatusBadge status="pending_approval" /></span>.
              </li>
              <li>
                A Team Leader must approve in <strong>Reviews</strong>.
              </li>
              <li>Scaffold note: PR creation is mocked (no real Bitbucket PR yet).</li>
            </ul>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-sidebar-border flex items-center justify-end gap-2 bg-surface">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-md border border-sidebar-border text-text-secondary hover:bg-surface-hover cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded-md bg-badge-pending text-black hover:bg-badge-pending/85 cursor-pointer"
          >
            Send to review
          </button>
        </div>
      </div>
    </div>
  );
}
