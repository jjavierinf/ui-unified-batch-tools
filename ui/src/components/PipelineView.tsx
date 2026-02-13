"use client";

import { FormEvent, useState } from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useEditorStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import { PipelineBoard } from "./pipeline/PipelineBoard";
import { SqlFileWorkbench } from "./SqlFileWorkbench";

export function PipelineView() {
  const pipelineSubMode = useWorkspaceStore((s) => s.pipelineSubMode);
  const setPipelineSubMode = useWorkspaceStore((s) => s.setPipelineSubMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const createPipeline = usePipelineStore((s) => s.createPipeline);
  const seedFiles = useEditorStore((s) => s.seedFiles);
  const setSelectedFile = useEditorStore((s) => s.selectFile);
  const focusFolder = useEditorStore((s) => s.focusFolder);
  const expandedFolders = useEditorStore((s) => s.expandedFolders);
  const setExpandedFolders = useEditorStore((s) => s.setExpandedFolders);
  const addToast = useToastStore((s) => s.addToast);
  const [openCreate, setOpenCreate] = useState(false);
  const [integrationName, setIntegrationName] = useState("NEW_integration");
  const [pipelineName, setPipelineName] = useState("new_pipeline");
  const [dagType, setDagType] = useState<"snapshot" | "incremental">("snapshot");
  const [schedule, setSchedule] = useState("0 * * * *");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const result = createPipeline({
      integrationName,
      pipelineName,
      dagType,
      schedule,
      timezone: "UTC",
    });
    seedFiles(result.files);

    const nextExpanded = new Set(expandedFolders);
    const parts = result.rootFolderPath.split("/");
    for (let i = 1; i <= parts.length; i += 1) {
      nextExpanded.add(parts.slice(0, i).join("/"));
    }
    setExpandedFolders(nextExpanded);
    focusFolder(result.rootFolderPath);

    if (result.files[0]?.path) {
      setSelectedFile(result.files[0].path);
    }
    setViewMode("pipeline");
    setPipelineSubMode("pro");
    setOpenCreate(false);
    addToast(`Pipeline ${result.displayFolder} created with 5 stage tasks`);
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-background">
      <div className="px-4 py-2 border-b border-sidebar-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-sidebar-border overflow-hidden">
            <button
              onClick={() => setPipelineSubMode("simple")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                pipelineSubMode === "simple"
                  ? "bg-accent text-white"
                  : "bg-transparent text-text-secondary hover:bg-surface-hover"
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setPipelineSubMode("pro")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                pipelineSubMode === "pro"
                  ? "bg-accent text-white"
                  : "bg-transparent text-text-secondary hover:bg-surface-hover"
              }`}
            >
              Pro
            </button>
          </div>
          <button
            onClick={() => setOpenCreate(true)}
            data-tour="create-pipeline-button"
            className="px-3 py-1.5 text-xs rounded-md border border-sidebar-border bg-background text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Create pipeline
          </button>
        </div>
      </div>

      {pipelineSubMode === "simple" ? <PipelineBoard /> : <SqlFileWorkbench />}

      {openCreate && (
        <div data-tour="create-pipeline-modal" className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-lg border border-sidebar-border bg-surface p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Create new pipeline
              </h3>
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-text-secondary mb-1">Integration</label>
                <input
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  className="w-full rounded-md border border-sidebar-border bg-background px-2 py-1.5 text-xs text-foreground"
                  spellCheck={false}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-secondary mb-1">Pipeline name</label>
                <input
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  className="w-full rounded-md border border-sidebar-border bg-background px-2 py-1.5 text-xs text-foreground"
                  spellCheck={false}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-text-secondary mb-1">Type</label>
                <select
                  value={dagType}
                  onChange={(e) => setDagType(e.target.value as "snapshot" | "incremental")}
                  className="w-full rounded-md border border-sidebar-border bg-background px-2 py-1.5 text-xs text-foreground"
                >
                  <option value="snapshot">snapshot</option>
                  <option value="incremental">incremental</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-text-secondary mb-1">Schedule</label>
                <input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full rounded-md border border-sidebar-border bg-background px-2 py-1.5 text-xs text-foreground font-mono"
                  spellCheck={false}
                  required
                />
              </div>
            </div>
            <p className="text-[10px] text-text-tertiary">
              Creates 5 tasks and SQL files in `ddl/extract/transform/load/dqa`.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="px-3 py-1.5 text-xs rounded-md border border-sidebar-border text-text-secondary hover:bg-surface-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-tour="create-pipeline-submit"
                className="px-3 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent/85 cursor-pointer"
              >
                Create and open in Pro
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
