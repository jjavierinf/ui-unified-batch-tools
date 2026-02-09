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

  const file = selectedFile ? files[selectedFile] : null;
  const isModified = file ? file.content !== file.savedContent : false;
  const showApproval =
    environment === "prod" && file?.status === "pending_approval";

  if (!selectedFile || !file) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 text-foreground">SQL</div>
          <div className="text-sm text-text-secondary">
            Select a file from the explorer to start editing
          </div>
        </div>
      </div>
    );
  }

  const basename = selectedFile.split("/").pop() ?? selectedFile;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* File tab bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-sidebar-border">
        <span className="text-sm text-foreground truncate">{basename}</span>
        <StatusBadge status={file.status} />
        {isModified && (
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Editor area ~70% */}
        <div className="relative" style={{ flex: 7 }}>
          <SqlEditor />
          <EditorActionButtons />
        </div>

        {/* Diff / Approval area ~30% */}
        <div
          className="border-t border-sidebar-border flex flex-col min-h-0"
          style={{ flex: 3 }}
        >
          {showApproval ? (
            <ApprovalPanel />
          ) : (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide bg-surface border-b border-sidebar-border">
                Diff
              </div>
              <div className="flex-1 min-h-0">
                {isModified ? (
                  <SqlDiffViewer />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-text-tertiary">
                    No changes to display
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
