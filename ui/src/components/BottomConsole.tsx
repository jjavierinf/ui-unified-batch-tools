"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { StatusBadge } from "@/components/StatusBadge";

interface BottomConsoleProps {
  columns: string[];
  rows: Array<Record<string, string | number>>;
  notice: string;
}

type TabId = "results" | "changes" | "pipeline";

const tabClass = (active: boolean) =>
  `px-3 py-1.5 text-[11px] font-medium border-b-2 transition-colors cursor-pointer ${
    active
      ? "text-foreground border-accent"
      : "text-text-tertiary border-transparent hover:text-text-secondary"
  }`;

export function BottomConsole({ columns, rows, notice }: BottomConsoleProps) {
  const [activeTab, setActiveTab] = useState<TabId>("results");
  const [collapsed, setCollapsed] = useState(false);

  const files = useEditorStore((s) => s.files);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  const changedFiles = Object.entries(files).filter(
    ([, f]) => f.content !== f.savedContent
  );

  return (
    <div
      className={`flex flex-col border-t border-sidebar-border bg-surface ${
        collapsed ? "" : "flex-1 min-h-0"
      }`}
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between shrink-0 px-2 bg-surface">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={tabClass(activeTab === "results")}
            onClick={() => {
              setActiveTab("results");
              if (collapsed) setCollapsed(false);
            }}
          >
            Results
            {rows.length > 0 && (
              <span className="ml-1.5 text-[10px] text-text-tertiary">
                ({rows.length})
              </span>
            )}
          </button>
          <button
            type="button"
            className={tabClass(activeTab === "changes")}
            onClick={() => {
              setActiveTab("changes");
              if (collapsed) setCollapsed(false);
            }}
          >
            Changes
            {changedFiles.length > 0 && (
              <span className="ml-1.5 text-[10px] text-text-tertiary">
                ({changedFiles.length})
              </span>
            )}
          </button>
          <button
            type="button"
            className={tabClass(activeTab === "pipeline")}
            onClick={() => {
              setActiveTab("pipeline");
              if (collapsed) setCollapsed(false);
            }}
          >
            Pipeline
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 text-text-tertiary hover:text-foreground rounded hover:bg-surface-hover cursor-pointer"
          title={collapsed ? "Expand console" : "Collapse console"}
          aria-label={collapsed ? "Expand console" : "Collapse console"}
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
            {collapsed ? (
              <polyline points="6 9 12 15 18 9" />
            ) : (
              <polyline points="6 15 12 9 18 15" />
            )}
          </svg>
        </button>
      </div>

      {/* Content area */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-auto">
          {activeTab === "results" && (
            <ResultsTab columns={columns} rows={rows} notice={notice} />
          )}
          {activeTab === "changes" && (
            <ChangesTab changedFiles={changedFiles} />
          )}
          {activeTab === "pipeline" && (
            <PipelineTab setViewMode={setViewMode} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Results tab ────────────────────────────────────────────── */

function ResultsTab({
  columns,
  rows,
  notice,
}: {
  columns: string[];
  rows: Array<Record<string, string | number>>;
  notice: string;
}) {
  if (columns.length === 0) {
    return (
      <div className="p-4 text-xs text-text-tertiary">
        Run a query to see results here.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 text-[10px] text-text-tertiary border-b border-sidebar-border shrink-0">
        {notice} &middot; {rows.length} row{rows.length !== 1 ? "s" : ""}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-surface sticky top-0">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="text-left px-3 py-1.5 border-b border-sidebar-border font-medium text-text-secondary"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`row-${idx}`}
                className="border-b border-sidebar-border/60"
              >
                {columns.map((c) => (
                  <td
                    key={`${idx}-${c}`}
                    className="px-3 py-1.5 text-foreground align-top"
                  >
                    {String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Changes tab ────────────────────────────────────────────── */

function ChangesTab({
  changedFiles,
}: {
  changedFiles: [string, { content: string; savedContent: string; status: import("@/lib/types").FileStatus }][];
}) {
  if (changedFiles.length === 0) {
    return (
      <div className="p-4 text-xs text-text-tertiary">
        No unsaved changes.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {changedFiles.map(([path, file]) => {
        const parts = path.split("/");
        const filename = parts[parts.length - 1];
        const dir = parts.slice(0, -1).join("/");

        return (
          <div
            key={path}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-surface-hover"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {filename}
              </p>
              <p className="text-[10px] text-text-tertiary truncate">{dir}</p>
            </div>
            <StatusBadge status={file.status} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Pipeline tab ───────────────────────────────────────────── */

function PipelineTab({
  setViewMode,
}: {
  setViewMode: (mode: import("@/lib/workspace-store").ViewMode) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-text-tertiary">
        Pipeline context is available in Pipeline Pro mode.
      </p>
      <button
        type="button"
        onClick={() => setViewMode("pipeline")}
        className="text-xs text-accent hover:text-accent/80 font-medium cursor-pointer"
      >
        Go to Pipelines &rarr;
      </button>
    </div>
  );
}
