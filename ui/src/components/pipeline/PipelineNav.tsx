"use client";

import { useState, useMemo } from "react";
import { usePipelineStore } from "@/lib/pipeline-store";

export function PipelineNav() {
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const selectedPipeline = usePipelineStore((s) => s.selectedPipeline);
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

  return (
    <div className="w-56 shrink-0 bg-surface border-r border-sidebar-border flex flex-col">
      {/* Back button + search */}
      <div className="px-2 py-2 border-b border-sidebar-border space-y-1.5">
        <button
          onClick={() => selectPipeline(null)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-foreground transition-colors cursor-pointer px-1 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All pipelines
        </button>
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary"
            width="12"
            height="12"
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
            placeholder="Filter..."
            className="w-full text-[11px] bg-background border border-sidebar-border rounded py-1 pl-6 pr-6 text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 flex items-center justify-center rounded text-text-tertiary hover:text-foreground cursor-pointer text-[10px]"
            >
              &#x2715;
            </button>
          )}
        </div>
      </div>

      {/* Pipeline list */}
      <div className="flex-1 overflow-y-auto py-0.5">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-[11px] text-text-tertiary text-center">
            No match
          </p>
        ) : (
          filtered.map((dag) => {
            const isActive = selectedPipeline === dag.dagName;
            const shortName = dag.dagName
              .replace(/^dag_/, "")
              .replace(`${dag.integrationName}_`, "");
            return (
              <button
                key={dag.dagName}
                onClick={() => selectPipeline(dag.dagName)}
                className={`w-full text-left px-3 py-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 ${
                  isActive
                    ? "bg-accent/10 text-accent border-r-2 border-accent"
                    : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <p className="text-xs font-medium truncate">{shortName}</p>
                <p className="text-[10px] text-text-tertiary truncate">
                  {dag.integrationName}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
