"use client";

import { useEditorStore } from "@/lib/store";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { useAuthStore } from "@/lib/auth-store";
import { getPipelineStatus } from "@/lib/pipeline-status";
import { describeCron } from "@/lib/cron-utils";
import { isTransparentSystemDdlTask } from "@/lib/task-type-utils";
import { StatusBadge } from "@/components/StatusBadge";

export function DashboardView() {
  const files = useEditorStore((s) => s.files);
  const tasks = usePipelineStore((s) => s.tasks);
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const selectPipeline = usePipelineStore((s) => s.selectPipeline);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setPipelineSubMode = useWorkspaceStore((s) => s.setPipelineSubMode);
  const currentUser = useAuthStore((s) => s.currentUser);
  const environment = useEditorStore((s) => s.environment);

  const isLeader = currentUser?.role === "leader";

  const counts = { draft: 0, saved_local: 0, pending_approval: 0, approved: 0 };
  for (const f of Object.values(files)) {
    if (f.status in counts) counts[f.status as keyof typeof counts]++;
  }

  const hasSavedFiles = Object.values(files).some(
    (f) => f.status === "saved_local" && f.content === f.savedContent
  );

  const cards: { label: string; count: number; bgClass: string; dotClass: string }[] = [
    { label: "Draft", count: counts.draft, bgClass: "bg-badge-draft/10", dotClass: "bg-badge-draft" },
    { label: "Saved", count: counts.saved_local, bgClass: "bg-badge-saved/10", dotClass: "bg-badge-saved" },
    { label: "Pending Review", count: counts.pending_approval, bgClass: "bg-badge-pending/10", dotClass: "bg-badge-pending" },
    { label: "Approved", count: counts.approved, bgClass: "bg-badge-approved/10", dotClass: "bg-badge-approved" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      {/* Status Cards */}
      <div className="mb-6">
        <h2 className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium mb-3">
          File Status Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card) => (
            <button
              key={card.label}
              onClick={() => setViewMode("code")}
              className="rounded-lg border border-sidebar-border bg-surface p-4 text-left cursor-pointer hover:shadow-md transition"
            >
              <div className={`inline-flex items-center gap-2 rounded-md px-2 py-1 ${card.bgClass} mb-2`}>
                <span className={`w-2 h-2 rounded-full ${card.dotClass}`} />
                <span className="text-xs text-text-secondary">{card.label}</span>
              </div>
              <div className="text-2xl font-semibold text-foreground">{card.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="mb-6">
        <h2 className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium mb-3">
          Pipelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {dagConfigs.map((dag) => {
            const visibleTasks = tasks.filter(
              (t) => t.dagName === dag.dagName && !isTransparentSystemDdlTask(t.name, t.sqlFilePath)
            );
            const pipelineStatus = getPipelineStatus(files, tasks, dag.dagName);
            const displayName = dag.dagName.replace(/^dag_/, "").replace(/_/g, " ");
            const typeBadge = dag.dagType === "incremental"
              ? "bg-blue-500/10 text-blue-400"
              : "bg-purple-500/10 text-purple-400";

            return (
              <button
                key={dag.dagName}
                onClick={() => {
                  selectPipeline(dag.dagName);
                  setViewMode("pipeline");
                  setPipelineSubMode("simple");
                }}
                className="rounded-lg border border-sidebar-border bg-surface p-3 text-left cursor-pointer hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground truncate mr-2">
                    {displayName}
                  </span>
                  <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeBadge}`}>
                    {dag.dagType}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
                  <span className="inline-flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {describeCron(dag.schedule)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {visibleTasks.length} tasks
                  </span>
                </div>
                <StatusBadge status={pipelineStatus} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setViewMode("code")}
            className="rounded-lg border border-sidebar-border bg-surface px-4 py-3 cursor-pointer hover:shadow-md transition flex items-center gap-2 text-xs font-medium text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Open SQL Explorer
          </button>

          <button
            onClick={() => setViewMode("pipeline")}
            className="rounded-lg border border-sidebar-border bg-surface px-4 py-3 cursor-pointer hover:shadow-md transition flex items-center gap-2 text-xs font-medium text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Create Pipeline
          </button>

          <button
            disabled={!hasSavedFiles}
            onClick={() => setViewMode("code")}
            className={`rounded-lg border border-sidebar-border px-4 py-3 transition flex items-center gap-2 text-xs font-medium ${
              hasSavedFiles
                ? "bg-surface cursor-pointer hover:shadow-md text-foreground"
                : "bg-surface-hover cursor-not-allowed text-text-tertiary"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Push to {environment === "dev" ? "Dev" : "Prod"}
          </button>

          {isLeader && (
            <button
              onClick={() => setViewMode("approvals")}
              className="rounded-lg border border-sidebar-border bg-surface px-4 py-3 cursor-pointer hover:shadow-md transition flex items-center gap-2 text-xs font-medium text-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              View Reviews
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
