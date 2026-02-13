"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { StatusBadge } from "@/components/StatusBadge";

type Tab = "unsaved" | "saved";

function extractFilename(path: string): string {
  return path.split("/").pop() || path;
}

function extractDirectory(path: string): string {
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

export function ChangesSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>("unsaved");
  const files = useEditorStore((s) => s.files);
  const toggleChangesPanel = useEditorStore((s) => s.toggleChangesPanel);
  const selectFile = useEditorStore((s) => s.selectFile);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  const unsavedFiles = Object.entries(files).filter(
    ([, f]) => f.content !== f.savedContent
  );

  const savedFiles = Object.entries(files).filter(
    ([, f]) => f.status === "saved_local"
  );

  const handleFileClick = (path: string) => {
    selectFile(path);
    setViewMode("code");
  };

  const currentFiles = activeTab === "unsaved" ? unsavedFiles : savedFiles;
  const emptyMessage =
    activeTab === "unsaved"
      ? "No unsaved changes."
      : "No files ready to push.";

  return (
    <div className="w-[300px] shrink-0 border-l border-sidebar-border bg-surface flex flex-col animate-slide-in">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-sidebar-border flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Changes</span>
        <button
          onClick={toggleChangesPanel}
          className="w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer transition-colors"
          title="Close changes panel"
        >
          <svg
            width="12"
            height="12"
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

      {/* Tabs */}
      <div className="flex border-b border-sidebar-border">
        <button
          onClick={() => setActiveTab("unsaved")}
          className={`flex-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "unsaved"
              ? "text-foreground border-accent"
              : "text-text-secondary hover:text-foreground border-transparent"
          }`}
        >
          Unsaved
          {unsavedFiles.length > 0 && (
            <span className="ml-1.5 min-w-[16px] h-4 inline-flex items-center justify-center rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-semibold px-1">
              {unsavedFiles.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "saved"
              ? "text-foreground border-accent"
              : "text-text-secondary hover:text-foreground border-transparent"
          }`}
        >
          Saved
          {savedFiles.length > 0 && (
            <span className="ml-1.5 min-w-[16px] h-4 inline-flex items-center justify-center rounded-full bg-accent/15 text-accent text-[10px] font-semibold px-1">
              {savedFiles.length}
            </span>
          )}
        </button>
      </div>

      {/* File list */}
      <div className="overflow-y-auto flex-1">
        {currentFiles.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-text-tertiary">
            {emptyMessage}
          </div>
        ) : (
          currentFiles.map(([path, file]) => (
            <button
              key={path}
              onClick={() => handleFileClick(path)}
              className="w-full text-left px-3 py-2 border-b border-sidebar-border/60 hover:bg-surface-hover cursor-pointer transition-colors flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {extractFilename(path)}
                </div>
                <div className="text-[10px] text-text-tertiary truncate">
                  {extractDirectory(path)}
                </div>
              </div>
              <StatusBadge status={file.status} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
