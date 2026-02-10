"use client";

import { useEditorStore } from "@/lib/store";
import { SqlEditor } from "./SqlEditor";
import { SqlDiffViewer } from "./SqlDiffViewer";
import { EditorActionButtons } from "./EditorActionButtons";
import { ApprovalPanel } from "./ApprovalPanel";
import { StatusBadge } from "./StatusBadge";

export function EditorPanel() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const environment = useEditorStore((s) => s.environment);
  const diffCollapsed = useEditorStore((s) => s.diffCollapsed);
  const toggleDiffPanel = useEditorStore((s) => s.toggleDiffPanel);

  const file = selectedFile ? files[selectedFile] : null;
  const isModified = file ? file.content !== file.savedContent : false;
  const showApproval =
    environment === "prod" && file?.status === "pending_approval";

  if (!selectedFile || !file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-text-tertiary/50"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p className="text-sm text-text-secondary">
            Select a file to start editing
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Choose a .sql file from the sidebar
          </p>
        </div>
      </div>
    );
  }

  const basename = selectedFile.split("/").pop() ?? selectedFile;
  const folder = selectedFile.split("/").slice(0, -1).join("/");

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* File tab bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-sidebar-border">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-text-tertiary"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-sm font-medium text-foreground truncate">
          {basename}
        </span>
        {folder && (
          <span className="text-[10px] text-text-tertiary truncate hidden sm:inline">
            {folder}
          </span>
        )}
        <StatusBadge status={file.status} />
        {isModified && (
          <span
            className="w-2 h-2 rounded-full bg-orange-400 shrink-0"
            title="Unsaved changes"
          />
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Editor area ~70% */}
        <div className="relative" style={{ flex: 7 }}>
          <SqlEditor />
          <EditorActionButtons />
        </div>

        {/* Diff / Approval area */}
        <div
          className="border-t border-sidebar-border flex flex-col min-h-0"
          style={{ flex: showApproval ? 3 : diffCollapsed ? 0 : 3 }}
        >
          {showApproval ? (
            <ApprovalPanel />
          ) : (
            <>
              <button
                onClick={toggleDiffPanel}
                className="flex items-center gap-2 px-4 py-1.5 bg-surface border-b border-sidebar-border cursor-pointer hover:bg-surface-hover transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50"
              >
                <span
                  className={`transition-transform duration-150 inline-flex items-center justify-center w-3 ${
                    diffCollapsed ? "" : "rotate-90"
                  }`}
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="currentColor"
                    className="text-text-tertiary"
                  >
                    <path d="M2 1l4 3-4 3z" />
                  </svg>
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-tertiary"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                  Changes
                </span>
                {isModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </button>
              {!diffCollapsed && (
                <div className="flex-1 min-h-0">
                  {isModified ? (
                    <SqlDiffViewer />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mb-2 opacity-40"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <p className="text-xs">No changes to display</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
