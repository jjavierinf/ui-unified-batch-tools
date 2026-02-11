"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useEditorStore } from "@/lib/store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { getNonDdlTasksForPipeline } from "@/lib/pipeline-mock-data";
import { describeCron, nextRunMinutes, formatNextRun } from "@/lib/cron-utils";
import { getPipelineStatus } from "@/lib/pipeline-status";
import { PipelineTaskCard } from "./PipelineTaskCard";
import { DagConfigEditor } from "./DagConfigEditor";
import { SqlEditorSlideOut } from "./SqlEditorSlideOut";
import { StatusBadge } from "@/components/StatusBadge";

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
  const updateDagField = usePipelineStore((s) => s.updateDagField);

  const selectFile = useEditorStore((s) => s.selectFile);
  const createFile = useEditorStore((s) => s.createFile);
  const files = useEditorStore((s) => s.files);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  const [slideOutFile, setSlideOutFile] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");

  const config = selectedPipeline
    ? dagConfigs.find((d) => d.dagName === selectedPipeline)
    : null;

  const pipelineTasks = selectedPipeline
    ? getNonDdlTasksForPipeline(tasks, selectedPipeline)
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
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
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
              <StatusBadge status={getPipelineStatus(files, tasks, config.dagName)} />
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${typeBadge[config.dagType] ?? "bg-gray-100 text-gray-700"}`}
              >
                {config.dagType}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
              {config.owner && (
                <>
                  <span className="text-text-tertiary">&middot;</span>
                  <span className="text-xs text-text-tertiary">
                    owner: {config.owner}
                  </span>
                </>
              )}
              {config.timezone && (
                <>
                  <span className="text-text-tertiary">&middot;</span>
                  <span className="text-xs text-text-tertiary">
                    {config.timezone}
                  </span>
                </>
              )}
              {(() => {
                const mins = nextRunMinutes(config.schedule);
                if (mins === null) return null;
                return (
                  <>
                    <span className="text-text-tertiary">&middot;</span>
                    <span className="text-xs text-accent">
                      Next in {formatNextRun(mins)}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column content */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Task list */}
        <div className="flex-1 min-w-0 overflow-y-auto px-5 py-4 border-r border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
              Task order ({pipelineTasks.length})
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
                  <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
                  <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                  <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
                </svg>
                Drag to reorder
              </span>
              <button
                onClick={() => setShowAddTask(true)}
                className="text-[10px] text-accent hover:text-accent/80 flex items-center gap-1 cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add task
              </button>
            </div>
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="task-list">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[100px] transition-colors rounded-lg ${
                    snapshot.isDraggingOver ? "bg-surface-hover" : ""
                  }`}
                >
                  {pipelineTasks.map((task, index) => (
                    <PipelineTaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      isLast={index === pipelineTasks.length - 1}
                      onClick={() => setSlideOutFile(task.sqlFilePath)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {showAddTask && config && (
            <div className="mt-3 p-3 rounded-lg border border-sidebar-border bg-surface/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTaskName.trim()) {
                      const name = newTaskName.trim().endsWith(".sql")
                        ? newTaskName.trim()
                        : `${newTaskName.trim()}.sql`;
                      const dagFolder = config.dagName.replace(/^dag_/, "").split("_").slice(0, 2).join("/");
                      const path = `dags/${dagFolder}/transform/${name}`;
                      createFile(path);
                      setSlideOutFile(path);
                      setShowAddTask(false);
                      setNewTaskName("");
                    } else if (e.key === "Escape") {
                      setShowAddTask(false);
                      setNewTaskName("");
                    }
                  }}
                  placeholder="new_task_name.sql"
                  className="flex-1 px-2 py-1.5 text-xs bg-background border border-accent rounded text-foreground placeholder:text-text-tertiary outline-none focus:ring-1 focus:ring-accent/50"
                  spellCheck={false}
                />
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskName("");
                  }}
                  className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">
                Enter to create, Esc to cancel
              </p>
            </div>
          )}
        </div>

        {/* Right: Configuration (tabbed) */}
        <div className="w-[380px] shrink-0 overflow-y-auto bg-surface/50">
          <DagConfigEditor
            config={config}
            onUpdateSchedule={(v) => updateDagSchedule(config.dagName, v)}
            onAddTag={(tag) => addDagTag(config.dagName, tag)}
            onRemoveTag={(tag) => removeDagTag(config.dagName, tag)}
            onUpdateField={(field, value) => updateDagField(config.dagName, field, value)}
            allTags={allTags}
          />
        </div>
      </div>

      {/* SQL Editor Slide-out */}
      {slideOutFile && (
        <SqlEditorSlideOut
          filePath={slideOutFile}
          onClose={() => setSlideOutFile(null)}
          onOpenInCodeMode={() => {
            selectFile(slideOutFile);
            setViewMode("code");
            setSlideOutFile(null);
          }}
        />
      )}
    </div>
  );
}
