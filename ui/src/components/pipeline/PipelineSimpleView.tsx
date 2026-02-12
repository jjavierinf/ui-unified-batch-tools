"use client";

import { useMemo, useState } from "react";
import { usePipelineStore } from "@/lib/pipeline-store";
import { describeCron, formatNextRun, nextRunMinutes } from "@/lib/cron-utils";
import { getNonDdlTasksForPipeline } from "@/lib/pipeline-mock-data";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useEditorStore } from "@/lib/store";
import { getNextStatus, getPipelineStatus, STATUS_MEANING } from "@/lib/pipeline-status";
import { isTransparentSystemDdlTask } from "@/lib/task-type-utils";
import { StatusBadge } from "@/components/StatusBadge";

export function PipelineSimpleView() {
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const tasks = usePipelineStore((s) => s.tasks);
  const selectPipeline = usePipelineStore((s) => s.selectPipeline);
  const setPipelineSubMode = useWorkspaceStore((s) => s.setPipelineSubMode);
  const files = useEditorStore((s) => s.files);
  const setFilesStatus = useEditorStore((s) => s.setFilesStatus);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return dagConfigs;
    const q = search.toLowerCase();
    return dagConfigs.filter(
      (dag) =>
        dag.dagName.toLowerCase().includes(q) ||
        dag.integrationName.toLowerCase().includes(q) ||
        dag.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [dagConfigs, search]);

  const cycleStatus = (dagName: string) => {
    const current = getPipelineStatus(files, tasks, dagName);
    const next = getNextStatus(current);
    const targetPaths = tasks
      .filter((t) => t.dagName === dagName && !isTransparentSystemDdlTask(t.name, t.sqlFilePath))
      .map((t) => t.sqlFilePath);
    if (targetPaths.length === 0) return;
    setFilesStatus(targetPaths, next);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-background">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pipelines Simple</h2>
          <p className="text-xs text-text-tertiary">
            Vista resumida para revisar salud y schedule sin editar detalle técnico.
          </p>
        </div>
        <div className="text-[10px] text-text-tertiary bg-surface-hover px-2 py-1 rounded-full">
          Mock explorer: 1 connection
        </div>
      </div>

      <div className="mb-4 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pipeline por nombre, integration o tag..."
          className="w-full text-xs bg-surface border border-sidebar-border rounded-lg py-2 px-3 text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((dag) => {
          const taskCount = getNonDdlTasksForPipeline(tasks, dag.dagName).length;
          const mins = nextRunMinutes(dag.schedule);
          const shortName = dag.dagName.replace(/^dag_/, "").replace(`${dag.integrationName}_`, "");
          return (
            <div
              key={dag.dagName}
              className="rounded-lg border border-sidebar-border bg-surface p-3 flex flex-col gap-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground truncate">{shortName}</p>
                <p className="text-[11px] text-text-tertiary truncate">{dag.integrationName}</p>
              </div>
              <div className="text-[11px] text-text-secondary">
                <p>{describeCron(dag.schedule)}</p>
                {mins !== null && <p className="text-text-tertiary">Next in {formatNextRun(mins)}</p>}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-tertiary">{taskCount} tasks</span>
                <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                  {dag.dagType}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                {(() => {
                  const status = getPipelineStatus(files, tasks, dag.dagName);
                  return (
                    <span title={STATUS_MEANING[status]}>
                      <StatusBadge status={status} />
                    </span>
                  );
                })()}
                <button
                  onClick={() => cycleStatus(dag.dagName)}
                  className="text-[10px] px-1.5 py-0.5 rounded border border-sidebar-border text-text-tertiary hover:text-foreground hover:bg-surface-hover cursor-pointer"
                  title="Cycle status for this pipeline (scaffold)"
                >
                  cycle
                </button>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    selectPipeline(dag.dagName);
                    setPipelineSubMode("pro");
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent/85 transition-colors cursor-pointer"
                >
                  Open in Pro
                </button>
                <span className="text-[10px] text-text-tertiary truncate">
                  {dag.tags.slice(0, 2).join(" · ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
