"use client";

import { useWorkspaceStore } from "@/lib/workspace-store";
import { PipelineBoard } from "./pipeline/PipelineBoard";
import { SqlFileWorkbench } from "./SqlFileWorkbench";

export function PipelineView() {
  const pipelineSubMode = useWorkspaceStore((s) => s.pipelineSubMode);
  const setPipelineSubMode = useWorkspaceStore((s) => s.setPipelineSubMode);

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-background">
      <div className="px-4 py-2 border-b border-sidebar-border bg-surface flex items-center justify-between">
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
        <span className="text-[10px] text-text-tertiary">
          Pipeline submode persisted
        </span>
      </div>

      {pipelineSubMode === "simple" ? <PipelineBoard /> : <SqlFileWorkbench />}
    </div>
  );
}
