"use client";

import { useState, useMemo } from "react";
import { usePipelineStore } from "@/lib/pipeline-store";
import type { DagConfig } from "@/lib/types";

const typeBadge: Record<string, string> = {
  snapshot: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  incremental: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export function PipelineOverview() {
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const tasks = usePipelineStore((s) => s.tasks);
  const selectPipeline = usePipelineStore((s) => s.selectPipeline);
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

  const grouped = useMemo(() => {
    const groups: Record<string, DagConfig[]> = {};
    for (const dag of filtered) {
      (groups[dag.integrationName] ??= []).push(dag);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const taskCountFor = (dagName: string) =>
    tasks.filter((t) => t.dagName === dagName).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      {/* Search bar */}
      <div className="px-6 py-4 border-b border-sidebar-border bg-surface">
        <div className="max-w-2xl flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              width="16"
              height="16"
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
              className="w-full text-sm bg-background border border-sidebar-border rounded-lg py-2 pl-9 pr-9 text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-foreground cursor-pointer"
              >
                &#x2715;
              </button>
            )}
          </div>
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {filtered.length} of {dagConfigs.length} DAGs
          </span>
        </div>
      </div>

      {/* Grouped pipeline table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {grouped.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-text-tertiary">
            <p className="text-sm">No pipelines match &ldquo;{search}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {grouped.map(([integration, dags]) => (
              <div key={integration}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
                    {integration}
                  </h3>
                  <span className="text-[10px] text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
                    {dags.length}
                  </span>
                </div>
                <div className="bg-surface border border-sidebar-border rounded-lg overflow-hidden">
                  {dags.map((dag, i) => {
                    const displayName = dag.dagName.replace(/^dag_/, "").replace(`${dag.integrationName}_`, "");
                    const count = taskCountFor(dag.dagName);
                    return (
                      <button
                        key={dag.dagName}
                        onClick={() => selectPipeline(dag.dagName)}
                        className={`w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer ${
                          i > 0 ? "border-t border-sidebar-border" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {displayName}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeBadge[dag.dagType]}`}
                        >
                          {dag.dagType}
                        </span>
                        <span className="shrink-0 text-xs text-text-tertiary font-mono w-24 text-right truncate" title={dag.schedule}>
                          {dag.schedule}
                        </span>
                        <span className="shrink-0 text-xs text-text-tertiary w-16 text-right">
                          {count} tasks
                        </span>
                        <div className="shrink-0 flex gap-1 max-w-[180px] overflow-hidden">
                          {dag.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <svg
                          className="shrink-0 text-text-tertiary"
                          width="16"
                          height="16"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
