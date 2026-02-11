"use client";

import { useState, useId } from "react";
import type {
  PipelineTask,
  TaskConfig,
  WorkloadLevel,
  LoadTargetType,
  DqaQueryType,
  DqaAlertKind,
} from "@/lib/types";

const TIMEZONES = [
  "UTC",
  "US/Eastern",
  "US/Pacific",
  "Europe/London",
  "Europe/Madrid",
];

const WORKLOAD_COLORS: Record<WorkloadLevel, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

interface TaskConfigPanelProps {
  task: PipelineTask;
  onUpdateConfig: (taskId: string, config: TaskConfig) => void;
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-foreground mb-1">
      {children}
    </label>
  );
}

export function TaskConfigPanel({ task, onUpdateConfig }: TaskConfigPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const config = task.taskConfig;
  const workloadId = useId();
  const sourceId = useId();
  const targetId = useId();
  const queryTzId = useId();
  const loadTypeId = useId();
  const dqaTypeId = useId();
  const alertKindId = useId();
  const toleranceId = useId();
  const emailToId = useId();
  const emailCcId = useId();
  const emailSubjectId = useId();
  const emailBodyId = useId();

  if (!config) return null;

  function update(partial: Partial<TaskConfig>) {
    onUpdateConfig(task.id, { ...config, ...partial });
  }

  const fileName = config.query?.file ?? task.sqlFilePath.split("/").pop() ?? "";
  const isDqa = task.stage === "dqa";
  const isLoad = task.stage === "load" || task.stage === "extract";
  const showLoadTarget = config.loadTarget !== undefined;
  const isEmail = config.loadTarget?.type === "Email";

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-accent transition-colors cursor-pointer"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <svg
          width="10"
          height="10"
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
        Task config
        {config.expectedWorkload && (
          <span
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${WORKLOAD_COLORS[config.expectedWorkload]}`}
          >
            {config.expectedWorkload}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 pl-3 border-l-2 border-sidebar-border space-y-3">
          {/* Workload */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor={workloadId}>Expected Workload</FieldLabel>
              <select
                id={workloadId}
                value={config.expectedWorkload ?? "medium"}
                onChange={(e) =>
                  update({ expectedWorkload: e.target.value as WorkloadLevel })
                }
                className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Query file (read-only) */}
            <div>
              <FieldLabel>Query File</FieldLabel>
              <div className="border border-sidebar-border rounded-md px-2 py-1.5 bg-surface text-text-secondary text-xs font-mono truncate">
                {fileName}
              </div>
            </div>
          </div>

          {/* Connections */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor={sourceId}>Source Connection</FieldLabel>
              <input
                id={sourceId}
                type="text"
                value={config.connection?.source ?? ""}
                onChange={(e) =>
                  update({
                    connection: {
                      ...config.connection,
                      source: e.target.value,
                      target: config.connection?.target,
                    },
                  })
                }
                className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                placeholder="e.g. sqlserver_Accounts"
                spellCheck={false}
              />
            </div>
            <div>
              <FieldLabel htmlFor={targetId}>Target Connection</FieldLabel>
              <input
                id={targetId}
                type="text"
                value={config.connection?.target ?? ""}
                onChange={(e) =>
                  update({
                    connection: {
                      source: config.connection?.source ?? "",
                      target: e.target.value || undefined,
                    },
                  })
                }
                className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                placeholder="e.g. starrocks_conn"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Query timezone */}
          <div className="max-w-[200px]">
            <FieldLabel htmlFor={queryTzId}>Query Timezone</FieldLabel>
            <select
              id={queryTzId}
              value={config.query?.timezone ?? "US/Eastern"}
              onChange={(e) =>
                update({
                  query: {
                    file: config.query?.file ?? fileName,
                    timezone: e.target.value,
                  },
                })
              }
              className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Load Target (for load/extract stages) */}
          {(isLoad || showLoadTarget) && (
            <div className="pt-2 border-t border-sidebar-border/50">
              <div className="flex items-center gap-2 mb-2">
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">
                  Load Target
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor={loadTypeId}>Target Type</FieldLabel>
                  <select
                    id={loadTypeId}
                    value={config.loadTarget?.type ?? "DB"}
                    onChange={(e) =>
                      update({
                        loadTarget: {
                          ...config.loadTarget,
                          type: e.target.value as LoadTargetType,
                        },
                      })
                    }
                    className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="DB">DB</option>
                    <option value="S3">S3</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              {/* Email-specific fields */}
              {isEmail && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel htmlFor={emailToId}>To</FieldLabel>
                      <input
                        id={emailToId}
                        type="text"
                        value={config.loadTarget?.to?.join(", ") ?? ""}
                        onChange={(e) =>
                          update({
                            loadTarget: {
                              ...config.loadTarget!,
                              type: "Email",
                              to: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            },
                          })
                        }
                        className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                        placeholder="email1@co.com, email2@co.com"
                        spellCheck={false}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor={emailCcId}>CC</FieldLabel>
                      <input
                        id={emailCcId}
                        type="text"
                        value={config.loadTarget?.cc?.join(", ") ?? ""}
                        onChange={(e) =>
                          update({
                            loadTarget: {
                              ...config.loadTarget!,
                              type: "Email",
                              cc: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            },
                          })
                        }
                        className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                        placeholder="cc@co.com"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel htmlFor={emailSubjectId}>Subject</FieldLabel>
                    <input
                      id={emailSubjectId}
                      type="text"
                      value={config.loadTarget?.subject ?? ""}
                      onChange={(e) =>
                        update({
                          loadTarget: {
                            ...config.loadTarget!,
                            type: "Email",
                            subject: e.target.value,
                          },
                        })
                      }
                      className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                      placeholder="Report subject"
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={emailBodyId}>Body</FieldLabel>
                    <textarea
                      id={emailBodyId}
                      value={config.loadTarget?.body ?? ""}
                      onChange={(e) =>
                        update({
                          loadTarget: {
                            ...config.loadTarget!,
                            type: "Email",
                            body: e.target.value,
                          },
                        })
                      }
                      rows={2}
                      className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
                      placeholder="Email body..."
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DQA Config */}
          {(isDqa || config.dqa) && (
            <div className="pt-2 border-t border-sidebar-border/50">
              <div className="flex items-center gap-2 mb-2">
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">
                  DQA Settings
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel htmlFor={dqaTypeId}>Query Type</FieldLabel>
                  <select
                    id={dqaTypeId}
                    value={config.dqa?.queryType ?? "single_query_notification"}
                    onChange={(e) =>
                      update({
                        dqa: {
                          ...config.dqa,
                          queryType: e.target.value as DqaQueryType,
                        },
                      })
                    }
                    className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="single_query_notification">Single Query</option>
                    <option value="source_vs_target_query_comparison">Source vs Target</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor={alertKindId}>Alert Kind</FieldLabel>
                  <select
                    id={alertKindId}
                    value={config.dqa?.alertKind ?? "warning"}
                    onChange={(e) =>
                      update({
                        dqa: {
                          ...config.dqa,
                          alertKind: e.target.value as DqaAlertKind,
                        },
                      })
                    }
                    className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor={toleranceId}>Tolerance</FieldLabel>
                  <input
                    id={toleranceId}
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.dqa?.tolerance ?? 0}
                    onChange={(e) =>
                      update({
                        dqa: {
                          ...config.dqa,
                          tolerance: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
