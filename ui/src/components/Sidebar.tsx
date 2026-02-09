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
    <aside className="w-70 min-w-70 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Workspace
          </span>
          <button
            onClick={() => setIsCreating(true)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-hover text-text-secondary hover:text-foreground transition-colors"
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
        <div className="text-sm font-medium text-foreground mt-0.5">
          SQL models
        </div>
      </div>

      {isCreating && (
        <div className="px-4 pb-2">
          <input
            ref={inputRef}
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleCreate}
            placeholder="filename.sql"
            className="w-full px-2 py-1 text-xs bg-surface border border-accent rounded text-foreground placeholder:text-text-tertiary outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <FileTree nodes={tree} />
      </div>
    </aside>
  );
}
