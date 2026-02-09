"use client";

import { useMemo } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { usePipelineStore } from "@/lib/pipeline-store";
import { getTasksForPipeline } from "@/lib/pipeline-mock-data";
import { describeCron } from "@/lib/cron-utils";
import { PipelineTaskCard } from "./PipelineTaskCard";
import { CronInput } from "./CronInput";
import { TagEditor } from "./TagEditor";

const typeBadge: Record<string, string> = {
  snapshot: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  incremental:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export function PipelineDetail() {
  const tasks = usePipelineStore((s) => s.tasks);
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);
  const selectedPipeline = usePipelineStore((s) => s.selectedPipeline);
  const selectPipeline = usePipelineStore((s) => s.selectPipeline);
  const reorderTask = usePipelineStore((s) => s.reorderTask);
  const updateDagSchedule = usePipelineStore((s) => s.updateDagSchedule);
  const addDagTag = usePipelineStore((s) => s.addDagTag);
  const removeDagTag = usePipelineStore((s) => s.removeDagTag);

  const config = selectedPipeline
    ? dagConfigs.find((d) => d.dagName === selectedPipeline)
    : null;

  const pipelineTasks = selectedPipeline
    ? getTasksForPipeline(tasks, selectedPipeline)
    : [];

  const allTags = useMemo(
    () => Array.from(new Set(dagConfigs.flatMap((d) => d.tags))).sort(),
    [dagConfigs]
  );

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !selectedPipeline) return;
    if (source.index === destination.index) return;
    reorderTask(selectedPipeline, source.index, destination.index);
  };

  if (!config) return null;

  const displayName = config.dagName.replace(/^dag_/, "");

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      {/* Header */}
      <div className="px-5 py-3 border-b border-sidebar-border bg-surface">
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectPipeline(null)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            title="Back to overview"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground truncate">
                {displayName}
              </h2>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${typeBadge[config.dagType] ?? "bg-gray-100 text-gray-700"}`}
              >
                {config.dagType}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-tertiary">
                {config.integrationName}
              </span>
              <span className="text-text-tertiary">&middot;</span>
              <span className="text-xs text-text-tertiary">
                {describeCron(config.schedule)}
              </span>
              <span className="text-text-tertiary">&middot;</span>
              <span className="text-xs text-text-tertiary">
                {pipelineTasks.length} tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Config section */}
        <div className="px-5 py-4 border-b border-sidebar-border bg-surface/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <CronInput
              value={config.schedule}
              onChange={(v) => updateDagSchedule(config.dagName, v)}
            />
            <TagEditor
              tags={config.tags}
              onAdd={(tag) => addDagTag(config.dagName, tag)}
              onRemove={(tag) => removeDagTag(config.dagName, tag)}
              allTags={allTags}
            />
          </div>
        </div>

        {/* Task list */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
              Task order ({pipelineTasks.length})
            </h3>
            <span className="text-[10px] text-text-tertiary flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
                <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
              </svg>
              Drag to reorder
            </span>
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="task-list">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`max-w-3xl min-h-[100px] transition-colors rounded-lg ${
                    snapshot.isDraggingOver ? "bg-surface-hover" : ""
                  }`}
                >
                  {pipelineTasks.map((task, index) => (
                    <PipelineTaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      isLast={index === pipelineTasks.length - 1}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
