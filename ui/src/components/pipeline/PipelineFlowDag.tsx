"use client";

import { useMemo } from "react";
import type { PipelineTask, PipelineStage } from "@/lib/types";

interface PipelineFlowDagProps {
  tasks: PipelineTask[];
  selectedTaskPath: string | null;
  onSelectTask: (sqlFilePath: string) => void;
}

const stageOrder: PipelineStage[] = ["ddl", "extract", "transform", "load", "dqa"];

const stageNodeColors: Record<PipelineStage, string> = {
  ddl: "border-cyan-500 bg-cyan-500/5",
  extract: "border-blue-500 bg-blue-500/5",
  transform: "border-purple-500 bg-purple-500/5",
  load: "border-green-500 bg-green-500/5",
  dqa: "border-orange-500 bg-orange-500/5",
};

const stageHeaderColors: Record<PipelineStage, string> = {
  ddl: "text-cyan-500",
  extract: "text-blue-500",
  transform: "text-purple-500",
  load: "text-green-500",
  dqa: "text-orange-500",
};

const stageLabels: Record<PipelineStage, string> = {
  ddl: "DDL",
  extract: "EXTRACT",
  transform: "TRANSFORM",
  load: "LOAD",
  dqa: "DQA",
};

function ArrowConnector() {
  return (
    <div className="flex items-center self-center px-1">
      <div className="w-6 h-px bg-text-tertiary" />
      <svg
        width="8"
        height="10"
        viewBox="0 0 8 10"
        className="text-text-tertiary -ml-px"
      >
        <path d="M0 0L8 5L0 10Z" fill="currentColor" />
      </svg>
    </div>
  );
}

function getFileName(path: string): string {
  return path.split("/").pop() ?? path;
}

export function PipelineFlowDag({
  tasks,
  selectedTaskPath,
  onSelectTask,
}: PipelineFlowDagProps) {
  const stageGroups = useMemo(() => {
    const grouped = new Map<PipelineStage, PipelineTask[]>();
    for (const task of tasks) {
      const existing = grouped.get(task.stage) ?? [];
      existing.push(task);
      grouped.set(task.stage, existing);
    }
    // Return only stages that have tasks, in canonical order
    return stageOrder
      .filter((stage) => grouped.has(stage))
      .map((stage) => ({
        stage,
        tasks: grouped.get(stage)!.sort((a, b) => a.order - b.order),
      }));
  }, [tasks]);

  if (stageGroups.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
        No tasks in this pipeline
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium shrink-0">
        Pipeline flow ({tasks.length} tasks)
      </h3>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {stageGroups.map((group, idx) => (
          <div key={group.stage} className="flex items-start">
            {idx > 0 && <ArrowConnector />}
            <div
              className={`min-w-[160px] max-w-[220px] rounded-lg border-2 border-l-4 ${stageNodeColors[group.stage]}`}
            >
              {/* Stage header */}
              <div className="px-3 py-2 border-b border-sidebar-border/30">
                <span
                  className={`text-[10px] uppercase font-semibold tracking-wider ${stageHeaderColors[group.stage]}`}
                >
                  {stageLabels[group.stage]}
                </span>
                <span className="text-[10px] text-text-tertiary ml-1.5">
                  {group.tasks.length}
                </span>
              </div>

              {/* Task list */}
              <div className="p-1.5 flex flex-col gap-1">
                {group.tasks.map((task) => {
                  const isSelected = task.sqlFilePath === selectedTaskPath;
                  return (
                    <button
                      key={task.id}
                      onClick={() => onSelectTask(task.sqlFilePath)}
                      className={`w-full text-left px-2.5 py-2 rounded-md transition-all cursor-pointer ${
                        isSelected
                          ? "bg-accent/10 ring-1 ring-accent/50"
                          : "hover:bg-surface-hover"
                      }`}
                    >
                      <div className="text-xs text-foreground truncate leading-tight">
                        {task.name}
                      </div>
                      <div className="text-[10px] text-text-tertiary truncate mt-0.5">
                        {getFileName(task.sqlFilePath)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
