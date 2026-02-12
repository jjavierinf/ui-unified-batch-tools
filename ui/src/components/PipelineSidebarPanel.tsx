"use client";

import { useMemo, useState } from "react";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useEditorStore } from "@/lib/store";
import { getNonDdlTasksForPipeline } from "@/lib/pipeline-mock-data";
import { describeCron } from "@/lib/cron-utils";
import { getNextStatus, getPipelineStatus, STATUS_MEANING } from "@/lib/pipeline-status";
import { isTransparentSystemDdlTask } from "@/lib/task-type-utils";
import { StatusBadge } from "./StatusBadge";
import { DagConfigEditor } from "./pipeline/DagConfigEditor";
import { TaskConfigPanel } from "./pipeline/TaskConfigPanel";

interface PipelineSidebarPanelProps {
  dagName: string;
}

const typeBadge: Record<string, string> = {
  snapshot: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  incremental:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export function PipelineSidebarPanel({ dagName }: PipelineSidebarPanelProps) {
  const tasks = usePipelineStore((s) => s.tasks);
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const updateDagSchedule = usePipelineStore((s) => s.updateDagSchedule);
  const addDagTag = usePipelineStore((s) => s.addDagTag);
  const removeDagTag = usePipelineStore((s) => s.removeDagTag);
  const updateDagField = usePipelineStore((s) => s.updateDagField);
  const updateTaskConfig = usePipelineStore((s) => s.updateTaskConfig);
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const setFilesStatus = useEditorStore((s) => s.setFilesStatus);
  const selectFile = useEditorStore((s) => s.selectFile);
  const [showDagConfig, setShowDagConfig] = useState(false);

  const config = dagConfigs.find((d) => d.dagName === dagName);

  const pipelineTasks = useMemo(
    () => getNonDdlTasksForPipeline(tasks, dagName),
    [tasks, dagName]
  );
  const allTags = useMemo(
    () => Array.from(new Set(dagConfigs.flatMap((d) => d.tags))).sort(),
    [dagConfigs]
  );

  if (!config) return null;

  const displayName = config.dagName.replace(/^dag_/, "");

  const pipelineStatus = getPipelineStatus(files, tasks, dagName);

  const cycleStatus = () => {
    const next = getNextStatus(pipelineStatus);
    const targetPaths = tasks
      .filter((t) => t.dagName === dagName && !isTransparentSystemDdlTask(t.name, t.sqlFilePath))
      .map((t) => t.sqlFilePath);
    if (targetPaths.length === 0) return;
    setFilesStatus(targetPaths, next);
  };

  const activeTask = pipelineTasks.find((t) => t.sqlFilePath === selectedFile);

  return (
    <div className="flex flex-col h-full">
      {/* Pipeline header */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-1.5 mb-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent shrink-0"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-xs font-semibold text-foreground truncate">
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              typeBadge[config.dagType] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {config.dagType}
          </span>
          <span className="text-[10px] text-text-tertiary">
            {config.integrationName}
          </span>
          <span title={STATUS_MEANING[pipelineStatus]}>
            <StatusBadge status={pipelineStatus} />
          </span>
          <button
            onClick={cycleStatus}
            className="text-[10px] px-1.5 py-0.5 rounded border border-sidebar-border text-text-tertiary hover:text-foreground hover:bg-surface-hover cursor-pointer"
            title="Cycle status for this pipeline (scaffold)"
          >
            cycle
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Schedule */}
        <div className="px-3 py-2.5 border-b border-sidebar-border">
          <div className="flex items-center gap-1.5 mb-1">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-tertiary"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
              Schedule
            </span>
          </div>
          <p className="text-xs text-foreground ml-3.5">
            {describeCron(config.schedule)}
          </p>
          <p className="text-[10px] text-text-tertiary ml-3.5 font-mono mt-0.5">
            {config.schedule}
          </p>
        </div>

        {/* Tags */}
        {config.tags.length > 0 && (
          <div className="px-3 py-2.5 border-b border-sidebar-border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-tertiary"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1 ml-3.5">
              {config.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 py-2.5 border-b border-sidebar-border">
          <button
            onClick={() => setShowDagConfig((v) => !v)}
            className="w-full text-left text-[11px] px-2 py-1.5 rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer"
          >
            {showDagConfig ? "Hide DAG params" : "Edit DAG params"}
          </button>
        </div>

        {showDagConfig && (
          <div className="h-[260px] border-b border-sidebar-border">
            <DagConfigEditor
              config={config}
              onUpdateSchedule={(v) => updateDagSchedule(config.dagName, v)}
              onAddTag={(tag) => addDagTag(config.dagName, tag)}
              onRemoveTag={(tag) => removeDagTag(config.dagName, tag)}
              onUpdateField={(field, value) => updateDagField(config.dagName, field, value)}
              allTags={allTags}
            />
          </div>
        )}

        {/* Task order */}
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-tertiary"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
              Tasks ({pipelineTasks.length})
            </span>
          </div>
          <div className="space-y-0.5 ml-1">
            {pipelineTasks.map((task, index) => {
              const isCurrent = task.sqlFilePath === selectedFile;
              return (
                <div
                  key={task.id}
                  onClick={() => selectFile(task.sqlFilePath)}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                    isCurrent
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-secondary hover:bg-surface-hover cursor-pointer"
                  }`}
                >
                  <span className="text-[10px] text-text-tertiary w-3 text-right shrink-0">
                    {index + 1}
                  </span>
                  <span className="truncate">{task.name}</span>
                  {files[task.sqlFilePath] && (
                    <span className="ml-auto">
                      <StatusBadge status={files[task.sqlFilePath].status} />
                    </span>
                  )}
                  {isCurrent && (
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="currentColor"
                      className="shrink-0"
                    >
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          {activeTask?.taskConfig && (
            <div className="mt-2 px-2 py-2 rounded-md border border-sidebar-border bg-background/50">
              <TaskConfigPanel task={activeTask} onUpdateConfig={updateTaskConfig} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
