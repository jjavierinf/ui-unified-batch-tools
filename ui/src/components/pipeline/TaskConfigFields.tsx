"use client";

import { useId } from "react";
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

export function TaskConfigFields({
  task,
  config,
  onUpdateConfig,
}: {
  task: PipelineTask;
  config: TaskConfig;
  onUpdateConfig: (taskId: string, config: TaskConfig) => void;
}) {
  const workloadId = useId();
  const sourceId = useId();
  const targetId = useId();
  const targetTableId = useId();
  const queryTzId = useId();
  const loadTypeId = useId();
  const dqaTypeId = useId();
  const alertKindId = useId();
  const toleranceId = useId();
  const emailToId = useId();
  const emailCcId = useId();
  const emailSubjectId = useId();
  const emailBodyId = useId();

  function update(partial: Partial<TaskConfig>) {
    onUpdateConfig(task.id, { ...config, ...partial });
  }

  const fileName = config.query?.file ?? task.sqlFilePath.split("/").pop() ?? "";
  const isExtract = task.stage === "extract";
  const isTransform = task.stage === "transform";
  const isLoad = task.stage === "load";
  const isDdl = task.stage === "ddl";
  const isDqa = task.stage === "dqa";
  const showTargetConnection = isExtract || isLoad || isDqa;
  const showLoadTarget = config.loadTarget !== undefined;
  const isEmail = config.loadTarget?.type === "Email";

  return (
    <div className="mt-2 pl-3 border-l-2 border-sidebar-border space-y-3">
      {isExtract && (
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
          <div>
            <FieldLabel htmlFor={targetTableId}>Target Table Name</FieldLabel>
            <input
              id={targetTableId}
              type="text"
              value={config.targetTableName ?? ""}
              onChange={(e) => update({ targetTableName: e.target.value })}
              className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
              placeholder="Optional override"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      <div>
        <FieldLabel>Query File</FieldLabel>
        <div className="border border-sidebar-border rounded-md px-2 py-1.5 bg-surface text-text-secondary text-xs font-mono truncate">
          {fileName}
        </div>
      </div>

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
        {showTargetConnection && (
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
        )}
      </div>

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
                <option value="source_vs_target_query_comparison">
                  Source vs Target
                </option>
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

          {config.dqa?.queryType === "source_vs_target_query_comparison" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Source Query File</FieldLabel>
                <input
                  type="text"
                  value={config.dqa?.sourceQueryFile ?? ""}
                  onChange={(e) =>
                    update({
                      dqa: {
                        ...config.dqa,
                        sourceQueryFile: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                  placeholder="e.g. source_count_by_day.sql"
                  spellCheck={false}
                />
              </div>
              <div>
                <FieldLabel>Target Query File</FieldLabel>
                <input
                  type="text"
                  value={config.dqa?.targetQueryFile ?? ""}
                  onChange={(e) =>
                    update({
                      dqa: {
                        ...config.dqa,
                        targetQueryFile: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                  placeholder="e.g. target_count_by_day.sql"
                  spellCheck={false}
                />
              </div>
              <div>
                <FieldLabel>Metric</FieldLabel>
                <select
                  value={config.dqa?.comparisonMetric ?? "count_per_day"}
                  onChange={(e) =>
                    update({
                      dqa: {
                        ...config.dqa,
                        comparisonMetric: e.target.value as "count_per_day" | "count_total",
                      },
                    })
                  }
                  className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer"
                >
                  <option value="count_per_day">count_per_day</option>
                  <option value="count_total">count_total</option>
                </select>
              </div>
              <div>
                <FieldLabel>Group by</FieldLabel>
                <input
                  type="text"
                  value={(config.dqa?.groupBy ?? ["day"]).join(", ")}
                  onChange={(e) =>
                    update({
                      dqa: {
                        ...config.dqa,
                        groupBy: e.target.value
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                  className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                  placeholder="day"
                  spellCheck={false}
                />
              </div>
              <p className="col-span-2 text-[10px] text-text-tertiary">
                Scaffold note: comparison execution is mocked; these fields exist to make the intent explicit.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="pt-1">
        <span className="text-[10px] text-text-tertiary">
          Stage: {isExtract ? "extract" : isTransform ? "transform" : isLoad ? "load" : isDdl ? "ddl" : "dqa"} · Task type: {task.taskType}
        </span>
      </div>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-foreground mb-1"
    >
      {children}
    </label>
  );
}
