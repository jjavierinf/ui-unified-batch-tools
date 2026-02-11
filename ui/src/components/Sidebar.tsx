"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { usePipelineStore } from "@/lib/pipeline-store";
import { buildTree } from "@/lib/file-utils";
import { isTransparentSystemDdlPath } from "@/lib/task-type-utils";
import { FileTree } from "./FileTree";
import { PipelineSidebarPanel } from "./PipelineSidebarPanel";

type SidebarTab = "explorer" | "pipeline";

export function Sidebar() {
  const files = useEditorStore((s) => s.files);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const selectedFolder = useEditorStore((s) => s.selectedFolder);
  const expandedFolders = useEditorStore((s) => s.expandedFolders);
  const setExpandedFolders = useEditorStore((s) => s.setExpandedFolders);
  const createFile = useEditorStore((s) => s.createFile);
  const tasks = usePipelineStore((s) => s.tasks);
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);

  const allPaths = useMemo(
    () => Object.keys(files).filter((p) => !isTransparentSystemDdlPath(p)),
    [files]
  );
  const tree = useMemo(() => buildTree(allPaths), [allPaths]);

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("explorer");
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fileCount = allPaths.length;

  useEffect(() => {
    // First visit in Pro mode: expand known folders so users immediately see stage/task files.
    if (expandedFolders.size > 0 || allPaths.length === 0) return;
    const defaults = new Set<string>();
    for (const path of allPaths) {
      const parts = path.split("/");
      for (let i = 1; i < parts.length; i += 1) {
        defaults.add(parts.slice(0, i).join("/"));
      }
    }
    if (defaults.size > 0) {
      setExpandedFolders(defaults);
    }
  }, [allPaths, expandedFolders.size, setExpandedFolders]);

  // Find pipeline context for the currently selected file
  const pipelineDagName = useMemo(() => {
    if (!selectedFile) return null;
    const task = tasks.find((t) => t.sqlFilePath === selectedFile);
    if (task) {
      const config = dagConfigs.find((d) => d.dagName === task.dagName);
      if (config) return config.dagName;
    }

    if (!selectedFolder) return null;
    const parts = selectedFolder.split("/").filter(Boolean);
    if (parts.length < 3 || parts[0] !== "dags") return null;
    const integration = parts[1];
    const folderName = parts[2];

    const fromFolder = dagConfigs.find(
      (d) =>
        d.integrationName === integration &&
        d.dagName.toLowerCase().includes(`_${folderName.toLowerCase()}`)
    );

    return fromFolder?.dagName ?? null;
  }, [selectedFile, selectedFolder, tasks, dagConfigs]);

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
    const targetFolder = selectedFolder || (expandedArr.length > 0 ? expandedArr[0] : "dags");

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
    <aside className="w-full min-w-0 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-sidebar-border">
        <button
          onClick={() => setSidebarTab("explorer")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 ${
            sidebarTab === "explorer"
              ? "text-foreground border-b-2 border-accent bg-surface/50"
              : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover"
          }`}
          title="File explorer"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Explorer
        </button>
        <button
          onClick={() => setSidebarTab("pipeline")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 ${
            sidebarTab === "pipeline"
              ? "text-foreground border-b-2 border-accent bg-surface/50"
              : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover"
          }`}
          title="Pipeline context"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Pipeline
        </button>
      </div>

      {/* Tab content */}
      {sidebarTab === "explorer" ? (
        <>
          {/* Explorer header */}
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
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-hover text-text-tertiary hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
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
        </>
      ) : (
        /* Pipeline tab content */
        pipelineDagName ? (
          <PipelineSidebarPanel dagName={pipelineDagName} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-tertiary/40 mb-3"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="text-xs text-text-secondary mb-1">
              No pipeline context
            </p>
            <p className="text-[10px] text-text-tertiary">
              Select a file that belongs to a pipeline to see its configuration here.
            </p>
          </div>
        )
      )}
    </aside>
  );
}
