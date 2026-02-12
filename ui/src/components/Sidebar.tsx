"use client";

import { useMemo, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { buildTree } from "@/lib/file-utils";
import { isTransparentSystemDdlPath } from "@/lib/task-type-utils";
import { getNonDdlTasksForPipeline } from "@/lib/pipeline-mock-data";
import { FileTree } from "./FileTree";

export function Sidebar() {
  const files = useEditorStore((s) => s.files);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const selectedFolder = useEditorStore((s) => s.selectedFolder);
  const expandedFolders = useEditorStore((s) => s.expandedFolders);
  const setExpandedFolders = useEditorStore((s) => s.setExpandedFolders);

  const tasks = usePipelineStore((s) => s.tasks);
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const selectPipeline = usePipelineStore((s) => s.selectPipeline);

  const setPipelineSubMode = useWorkspaceStore((s) => s.setPipelineSubMode);

  const allPaths = useMemo(
    () => Object.keys(files).filter((p) => !isTransparentSystemDdlPath(p)),
    [files]
  );
  const tree = useMemo(() => buildTree(allPaths), [allPaths]);
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

  const pipelineDagName = useMemo(() => {
    if (selectedFile) {
      const task = tasks.find((t) => t.sqlFilePath === selectedFile);
      if (task) {
        const config = dagConfigs.find((d) => d.dagName === task.dagName);
        if (config) return config.dagName;
      }
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

  const pipelineContext = useMemo(() => {
    if (!pipelineDagName) return null;
    const config = dagConfigs.find((d) => d.dagName === pipelineDagName);
    if (!config) return null;
    const taskCount = getNonDdlTasksForPipeline(tasks, pipelineDagName).length;
    return {
      dagName: pipelineDagName,
      displayName: pipelineDagName.replace(/^dag_/, ""),
      integration: config.integrationName,
      taskCount,
    };
  }, [dagConfigs, pipelineDagName, tasks]);

  return (
    <aside className="w-full min-w-0 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full">
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
            <span className="text-xs font-medium text-foreground">Explorer</span>
            <span className="text-[10px] text-text-tertiary bg-surface-hover px-1.5 py-0.5 rounded-full">
              {fileCount}
            </span>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-text-tertiary">
          Files are created via pipeline flows only.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        <FileTree nodes={tree} />
      </div>

      {pipelineContext && (
        <div className="border-t border-sidebar-border px-3 py-2 bg-surface/50">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Pipeline context</p>
          <p className="text-xs text-foreground truncate mt-1" title={pipelineContext.displayName}>
            {pipelineContext.displayName}
          </p>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            {pipelineContext.integration} · {pipelineContext.taskCount} tasks
          </p>
          <button
            onClick={() => {
              selectPipeline(pipelineContext.dagName);
              setPipelineSubMode("simple");
            }}
            className="mt-2 w-full text-[11px] px-2 py-1.5 rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer"
          >
            Open pipeline handoff
          </button>
        </div>
      )}
    </aside>
  );
}
