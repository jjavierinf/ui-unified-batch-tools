"use client";

import { useState, useMemo } from "react";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useEditorStore } from "@/lib/store";
import { describeCron, nextRunMinutes, formatNextRun } from "@/lib/cron-utils";
import { isTransparentSystemDdlTask } from "@/lib/task-type-utils";
import { getNextStatus, getPipelineStatus, STATUS_MEANING } from "@/lib/pipeline-status";
import { StatusBadge } from "@/components/StatusBadge";
import type { DagConfig } from "@/lib/types";

const typeBadge: Record<string, string> = {
  snapshot: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  incremental: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export function PipelineOverview() {
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const tasks = usePipelineStore((s) => s.tasks);
  const files = useEditorStore((s) => s.files);
  const setFilesStatus = useEditorStore((s) => s.setFilesStatus);
  const selectPipeline = usePipelineStore((s) => s.selectPipeline);
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"tag" | "integration">("tag");

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

  const grouped = useMemo(() => {
    const groups: Record<string, DagConfig[]> = {};
    for (const dag of filtered) {
      if (groupBy === "integration") {
        (groups[dag.integrationName] ??= []).push(dag);
        continue;
      }

      const nonIntegrationTags = dag.tags.filter(
        (tag) => tag.toLowerCase() !== dag.integrationName.toLowerCase()
      );
      const tagsToUse = nonIntegrationTags.length > 0 ? nonIntegrationTags : ["untagged"];
      for (const tag of tagsToUse) {
        (groups[tag] ??= []).push(dag);
      }
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, groupBy]);

  const taskCountFor = (dagName: string) =>
    tasks.filter((t) => t.dagName === dagName && !isTransparentSystemDdlTask(t.name, t.sqlFilePath)).length;

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
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      {/* Search bar */}
      <div className="px-6 py-3 border-b border-sidebar-border bg-surface">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, integration, or tag..."
              className="w-full text-sm bg-background border border-sidebar-border rounded-lg py-1.5 pl-9 pr-8 text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded text-text-tertiary hover:text-foreground cursor-pointer"
              >
                &#x2715;
              </button>
            )}
          </div>
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {filtered.length} of {dagConfigs.length} DAGs
          </span>
          <div className="inline-flex rounded-md border border-sidebar-border overflow-hidden">
            <div data-tour="group-toggle" className="inline-flex">
            <button
              onClick={() => setGroupBy("tag")}
              className={`px-2 py-1 text-[10px] cursor-pointer ${
                groupBy === "tag"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              by tag
            </button>
            <button
              onClick={() => setGroupBy("integration")}
              className={`px-2 py-1 text-[10px] cursor-pointer ${
                groupBy === "integration"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              by integration
            </button>
            </div>
          </div>
        </div>
        <div data-tour="status-legend" className="mt-2 flex items-center gap-2 text-[10px] text-text-tertiary">
          <span className="uppercase tracking-wider">Status legend</span>
          <span title={STATUS_MEANING.draft}><StatusBadge status="draft" /></span>
          <span title={STATUS_MEANING.saved_local}><StatusBadge status="saved_local" /></span>
          <span title={STATUS_MEANING.submitted}><StatusBadge status="submitted" /></span>
          <span title={STATUS_MEANING.pending_approval}><StatusBadge status="pending_approval" /></span>
          <span title={STATUS_MEANING.approved}><StatusBadge status="approved" /></span>
          <span className="ml-1">Use status button per row to cycle in scaffold.</span>
        </div>
      </div>

      {/* Grouped pipeline table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-text-tertiary">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-40"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="text-sm">No pipelines match &ldquo;{search}&rdquo;</p>
            <button
              onClick={() => setSearch("")}
              className="text-xs text-accent hover:underline mt-1 cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([integration, dags]) => (
              <section key={integration}>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">
                    {integration}
                  </h3>
                  <span className="text-[10px] text-text-tertiary bg-surface-hover px-1.5 py-0.5 rounded-full">
                    {dags.length}
                  </span>
                </div>

                {/* Table header */}
                <div className="bg-surface border border-sidebar-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_90px_140px_60px_80px_auto_28px] gap-2 px-4 py-1.5 border-b border-sidebar-border text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
                    <span>Pipeline</span>
                    <span>Type</span>
                    <span>Schedule</span>
                    <span className="text-right">Tasks</span>
                    <span>Status</span>
                    <span>Tags</span>
                    <span></span>
                  </div>

                  {/* Rows */}
                  {dags.map((dag, i) => {
                    const displayName = dag.dagName
                      .replace(/^dag_/, "")
                      .replace(`${dag.integrationName}_`, "");
                    const count = taskCountFor(dag.dagName);
                    const schedule = describeCron(dag.schedule);
                    const nextMins = nextRunMinutes(dag.schedule);

                    return (
                      <button
                        key={dag.dagName}
                        onClick={() => selectPipeline(dag.dagName)}
                        className={`w-full text-left grid grid-cols-[1fr_90px_140px_60px_80px_auto_28px] gap-2 items-center px-4 py-2.5 border-t border-sidebar-border first:border-t-0 hover:bg-accent/5 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 ${
                          i % 2 === 1 ? "bg-surface-hover/30" : ""
                        }`}
                      >
                        <span className="text-sm font-medium text-foreground truncate">
                          {displayName}
                        </span>
                        <span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeBadge[dag.dagType]}`}
                          >
                            {dag.dagType}
                          </span>
                        </span>
                        <span className="text-xs text-text-secondary" title={dag.schedule}>
                          <span>{schedule}</span>
                          {nextMins !== null && (
                            <span className="block text-[10px] text-text-tertiary">
                              in {formatNextRun(nextMins)}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-text-tertiary text-right tabular-nums">
                          {count}
                        </span>
                        <span className="flex items-center gap-1">
                          <StatusBadge status={getPipelineStatus(files, tasks, dag.dagName)} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleStatus(dag.dagName);
                            }}
                            data-tour="status-cycle"
                            className="text-[10px] px-1.5 py-0.5 rounded border border-sidebar-border text-text-tertiary hover:text-foreground hover:bg-surface-hover cursor-pointer"
                            title="Cycle status for this pipeline (scaffold)"
                          >
                            cycle
                          </button>
                        </span>
                        <div className="flex gap-1 overflow-hidden">
                          {dag.tags
                            .filter((t) => t !== dag.integrationName)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full whitespace-nowrap"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                        <svg
                          className="shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
