"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { PipelineTask, PipelineStage } from "@/lib/types";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useEditorStore } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskConfigFields } from "./TaskConfigFields";

const stageBorderColors: Record<PipelineStage, string> = {
  extract: "border-l-blue-500",
  transform: "border-l-purple-500",
  load: "border-l-green-500",
  ddl: "border-l-cyan-500",
  dqa: "border-l-orange-500",
};

const stageBadgeColors: Record<PipelineStage, string> = {
  extract: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  transform:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  load: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ddl: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  dqa: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const stageLabels: Record<PipelineStage, string> = {
  extract: "EXTRACT",
  transform: "TRANSFORM",
  load: "LOAD",
  ddl: "DDL",
  dqa: "DQA",
};

interface PipelineTaskCardProps {
  task: PipelineTask;
  index: number;
  isLast: boolean;
  onClick?: () => void;
}

export function PipelineTaskCard({ task, index, isLast, onClick }: PipelineTaskCardProps) {
  const updateTaskConfig = usePipelineStore((s) => s.updateTaskConfig);
  const status = useEditorStore((s) => s.files[task.sqlFilePath]?.status ?? "draft");
  const fileName = task.sqlFilePath.split("/").pop() ?? task.sqlFilePath;
  const [showConfig, setShowConfig] = useState(false);
  const summaryLines = (() => {
    const cfg = task.taskConfig;
    if (!cfg) return [];

    const lines: string[] = [];

    // Connection / timezone are the most “at a glance” useful for SQL users.
    if (cfg.connection?.source) {
      if (cfg.connection.target) lines.push(`${cfg.connection.source} -> ${cfg.connection.target}`);
      else lines.push(cfg.connection.source);
    }
    if (cfg.query?.timezone) lines.push(`TZ: ${cfg.query.timezone}`);

    if (task.stage === "load" && cfg.loadTarget?.type) {
      if (cfg.loadTarget.type === "DB" && cfg.loadTarget.connection?.target) {
        lines.push(`Target: ${cfg.loadTarget.connection.target}`);
      } else if (cfg.loadTarget.type === "S3") {
        lines.push("Target: S3");
      } else if (cfg.loadTarget.type === "Email") {
        const to = cfg.loadTarget.to?.length ? ` (${cfg.loadTarget.to.join(", ")})` : "";
        lines.push(`Target: Email${to}`);
      }
    }

    if (task.stage === "ddl") {
      if (cfg.targetTableName) lines.push(`DDL for: ${cfg.targetTableName}`);
      else lines.push("DDL: schema change");
    }

    if (task.stage === "dqa") {
      const dqa = cfg.dqa;
      if (dqa?.queryType === "source_vs_target_query_comparison") {
        const metric = dqa.comparisonMetric ?? "count_per_day";
        lines.push(`DQA: source vs target · ${metric}`);
      } else {
        const tol = typeof dqa?.tolerance === "number" ? ` · tol ${dqa.tolerance}%` : "";
        lines.push(`DQA: rule check${tol}`);
      }
    }

    // Keep it short: 2 lines max.
    return lines.filter(Boolean).slice(0, 2);
  })();

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="relative"
        >
          {/* Connector arrow between tasks */}
          {!isLast && !snapshot.isDragging && (
            <div className="absolute left-5 top-full w-px h-2 flex flex-col items-center z-0">
              <div className="w-px flex-1 bg-sidebar-border" />
              <svg
                width="8"
                height="6"
                viewBox="0 0 8 6"
                className="text-sidebar-border shrink-0 -mt-px"
              >
                <path d="M4 6L0 0h8z" fill="currentColor" />
              </svg>
            </div>
          )}

          <div
            className={`relative bg-background border border-sidebar-border rounded-lg border-l-4 ${
              stageBorderColors[task.stage]
            } transition-shadow ${
              snapshot.isDragging
                ? "shadow-lg ring-2 ring-accent/30"
                : "shadow-sm hover:shadow-md"
            } ${!isLast ? "mb-4" : ""}`}
          >
            <div className="flex items-stretch">
              {/* Drag handle */}
              <div
                {...provided.dragHandleProps}
                className="flex items-center px-2 text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing"
                title="Drag to reorder"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <circle cx="5" cy="3" r="1.5" />
                  <circle cx="11" cy="3" r="1.5" />
                  <circle cx="5" cy="8" r="1.5" />
                  <circle cx="11" cy="8" r="1.5" />
                  <circle cx="5" cy="13" r="1.5" />
                  <circle cx="11" cy="13" r="1.5" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 py-2.5 pr-3 min-w-0">
                <div
                  className="cursor-pointer"
                  onClick={onClick}
                  role={onClick ? "button" : undefined}
                  tabIndex={onClick ? 0 : undefined}
                  onKeyDown={
                    onClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onClick();
                          }
                        }
                      : undefined
                  }
                >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-text-tertiary bg-surface-hover px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {task.name}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${stageBadgeColors[task.stage]}`}
                  >
                    {stageLabels[task.stage]}
                  </span>
                  <div className="flex-1" />
                  <StatusBadge status={status} />
                  {task.taskConfig && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfig((v) => !v);
                      }}
                      className={`w-7 h-7 flex items-center justify-center rounded-md border border-sidebar-border transition-colors cursor-pointer ${
                        showConfig
                          ? "bg-accent/10 text-accent"
                          : "text-text-secondary hover:text-foreground hover:bg-surface-hover"
                      }`}
                      title={showConfig ? "Hide task config" : "Show task config"}
                      aria-label="Toggle task config"
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
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-1 truncate pl-0.5">
                  {fileName}
                </p>
                {summaryLines.length > 0 && (
                  <div className="mt-1 pl-0.5 space-y-0.5">
                    {summaryLines.map((line) => (
                      <p key={line} className="text-[11px] text-text-secondary truncate">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                </div>

                {task.taskConfig && showConfig && (
                  <TaskConfigFields
                    task={task}
                    config={task.taskConfig}
                    onUpdateConfig={updateTaskConfig}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
