"use client";

import { Draggable } from "@hello-pangea/dnd";
import type { PipelineTask, PipelineStage } from "@/lib/types";

const stageBorderColors: Record<PipelineStage, string> = {
  extract: "border-l-blue-500",
  transform: "border-l-purple-500",
  load: "border-l-green-500",
  dqa: "border-l-orange-500",
};

const stageBadgeColors: Record<PipelineStage, string> = {
  extract: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  transform: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  load: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  dqa: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const stageLabels: Record<PipelineStage, string> = {
  extract: "EXTRACT",
  transform: "TRANSFORM",
  load: "LOAD",
  dqa: "DQA",
};

interface PipelineTaskCardProps {
  task: PipelineTask;
  index: number;
}

export function PipelineTaskCard({ task, index }: PipelineTaskCardProps) {
  const fileName = task.sqlFilePath.split("/").pop() ?? task.sqlFilePath;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-background border border-sidebar-border rounded-md p-3 mb-2 border-l-4 ${
            stageBorderColors[task.stage]
          } transition-shadow ${snapshot.isDragging ? "shadow-lg" : "shadow-sm"}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-tertiary">
              #{task.order}
            </span>
            <span className="text-sm font-medium text-foreground">
              {task.name}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${stageBadgeColors[task.stage]}`}
            >
              {stageLabels[task.stage]}
            </span>
          </div>

          <p className="text-xs text-text-tertiary mt-1.5 truncate">
            {fileName}
          </p>
        </div>
      )}
    </Draggable>
  );
}
