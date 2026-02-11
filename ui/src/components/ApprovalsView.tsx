"use client";

import { useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { useEditorStore } from "@/lib/store";

export function ApprovalsView() {
  const files = useEditorStore((s) => s.files);
  const darkMode = useEditorStore((s) => s.darkMode);
  const approveAll = useEditorStore((s) => s.approveAll);
  const rejectAll = useEditorStore((s) => s.rejectAll);
  const [lastAction, setLastAction] = useState<"approved" | "rejected" | null>(null);

  const pendingEntries = Object.entries(files).filter(
    ([, f]) => f.status === "pending_approval"
  );

  const handleApprove = () => {
    approveAll();
    setLastAction("approved");
  };

  const handleReject = () => {
    rejectAll();
    setLastAction("rejected");
  };

  if (pendingEntries.length === 0 && lastAction) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <h1 className="text-lg font-semibold text-foreground mb-6">
          Submissions for Review
        </h1>
        <ConfirmationCard action={lastAction} onDismiss={() => setLastAction(null)} />
      </div>
    );
  }

  if (pendingEntries.length === 0) {
    return <EmptyState />;
  }

  const oldestSubmission = pendingEntries.reduce((oldest, [, f]) => {
    if (!f.submittedAt) return oldest;
    if (!oldest) return f.submittedAt;
    return f.submittedAt < oldest ? f.submittedAt : oldest;
  }, null as string | null);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <h1 className="text-lg font-semibold text-foreground mb-6">
        Submissions for Review
      </h1>

      <SubmissionCard
        entries={pendingEntries}
        submittedAt={oldestSubmission}
        darkMode={darkMode}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

function SubmissionCard({
  entries,
  submittedAt,
  darkMode,
  onApprove,
  onReject,
}: {
  entries: [string, { content: string; savedContent: string }][];
  submittedAt: string | null;
  darkMode: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-sidebar-border bg-surface overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Submission &mdash; {entries.length} file{entries.length !== 1 ? "s" : ""} changed
            </p>
            {submittedAt && (
              <p className="text-xs text-text-tertiary mt-0.5">
                Submitted {formatRelativeDate(submittedAt)}
              </p>
            )}
          </div>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          Pending
        </span>
      </div>

      {/* File list */}
      <div className="divide-y divide-sidebar-border/50">
        {entries.map(([path, file]) => (
          <FileChangeLine
            key={path}
            path={path}
            file={file}
            isExpanded={expandedFile === path}
            onToggle={() =>
              setExpandedFile(expandedFile === path ? null : path)
            }
            darkMode={darkMode}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-sidebar-border bg-surface-hover/30">
        <button
          onClick={onApprove}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Approve All
        </button>
        <button
          onClick={onReject}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md border border-sidebar-border text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Request Changes
        </button>
      </div>
    </div>
  );
}

function FileChangeLine({
  path,
  file,
  isExpanded,
  onToggle,
  darkMode,
}: {
  path: string;
  file: { content: string; savedContent: string };
  isExpanded: boolean;
  onToggle: () => void;
  darkMode: boolean;
}) {
  const basename = path.split("/").pop() ?? path;
  const hasChanges = file.content !== file.savedContent;

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-left hover:bg-surface-hover/50 transition-colors cursor-pointer"
      >
        <span
          className={`transition-transform duration-150 inline-flex items-center justify-center w-3 ${
            isExpanded ? "rotate-90" : ""
          }`}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-text-tertiary">
            <path d="M2 1l4 3-4 3z" />
          </svg>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-sm text-foreground truncate">{basename}</span>
        <span className="text-[10px] text-text-tertiary truncate hidden sm:inline">
          {path}
        </span>
        <span className="ml-auto shrink-0">
          {hasChanges ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Modified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary/40" />
              Unchanged
            </span>
          )}
        </span>
      </button>
      {isExpanded && (
        <div className="border-t border-sidebar-border/50 bg-background" style={{ height: 260 }}>
          <DiffEditor
            key={`approval-diff-${path}`}
            original={file.savedContent}
            modified={file.content}
            language="sql"
            theme={darkMode ? "vs-dark" : "light"}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              renderSideBySide: false,
              padding: { top: 8 },
              automaticLayout: true,
            }}
          />
        </div>
      )}
    </div>
  );
}

function ConfirmationCard({ action, onDismiss }: { action: "approved" | "rejected"; onDismiss: () => void }) {
  const isApproved = action === "approved";
  return (
    <div className="rounded-lg border border-sidebar-border bg-surface p-8 text-center">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${isApproved ? "bg-green-500/10" : "bg-orange-500/10"}`}>
        {isApproved ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
            <path d="M3 12h18" />
          </svg>
        )}
      </div>
      <p className="text-sm font-medium text-foreground">
        {isApproved ? "Submission approved" : "Changes requested"}
      </p>
      <p className="text-xs text-text-tertiary mt-1">
        {isApproved
          ? "All files have been approved and merged to production."
          : "Files have been sent back for revision."}
      </p>
      <button
        onClick={onDismiss}
        className="mt-4 text-xs text-text-secondary hover:text-foreground transition-colors cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-hover mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary/60">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm text-text-secondary font-medium">
          No submissions pending review
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          Submissions from the team will appear here
        </p>
      </div>
    </div>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
