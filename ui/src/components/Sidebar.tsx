"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { buildTree } from "@/lib/file-utils";
import { FileTree } from "./FileTree";

export function Sidebar() {
  const files = useEditorStore((s) => s.files);
  const expandedFolders = useEditorStore((s) => s.expandedFolders);
  const createFile = useEditorStore((s) => s.createFile);
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);

  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fileCount = Object.keys(files).length;

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = () => {
    const name = newFileName.trim();
    if (!name) {
      setIsCreating(false);
      setNewFileName("");
      return;
    }

    const finalName = name.endsWith(".sql") ? name : `${name}.sql`;

    // Find the deepest expanded folder to create inside it
    const expandedArr = Array.from(expandedFolders).sort(
      (a, b) => b.split("/").length - a.split("/").length
    );
    const targetFolder = expandedArr.length > 0 ? expandedArr[0] : "dags";

    const fullPath = `${targetFolder}/${finalName}`;
    createFile(fullPath);
    setIsCreating(false);
    setNewFileName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewFileName("");
    }
  };

  return (
    <aside className="w-56 min-w-56 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-tertiary"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-xs font-medium text-foreground">
              Explorer
            </span>
            <span className="text-[10px] text-text-tertiary bg-surface-hover px-1.5 py-0.5 rounded-full">
              {fileCount}
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-hover text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
            title="New SQL file"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="px-3 py-2 border-b border-sidebar-border bg-surface/50">
          <div className="flex items-center gap-1.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-accent"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleCreate}
              placeholder="filename.sql"
              className="flex-1 px-2 py-1 text-xs bg-background border border-accent rounded text-foreground placeholder:text-text-tertiary outline-none focus:ring-1 focus:ring-accent/50"
              spellCheck={false}
            />
          </div>
          <p className="text-[10px] text-text-tertiary mt-1 ml-5">
            Enter to create, Esc to cancel
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        <FileTree nodes={tree} />
      </div>
    </aside>
  );
}
