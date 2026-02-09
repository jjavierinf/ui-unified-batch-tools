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
  transform:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
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
  isLast: boolean;
}

export function PipelineTaskCard({ task, index, isLast }: PipelineTaskCardProps) {
  const fileName = task.sqlFilePath.split("/").pop() ?? task.sqlFilePath;

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
                </div>
                <p className="text-xs text-text-tertiary mt-1 truncate pl-0.5">
                  {fileName}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
