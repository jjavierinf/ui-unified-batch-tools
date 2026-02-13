"use client";

import { useState } from "react";

interface BottomConsoleProps {
  columns: string[];
  rows: Array<Record<string, string | number>>;
  notice: string;
}

export function BottomConsole({ columns, rows, notice }: BottomConsoleProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`flex flex-col border-t border-sidebar-border bg-surface ${
        collapsed ? "" : "flex-1 min-h-0"
      }`}
    >
      <div className="flex items-center justify-between shrink-0 px-3 py-1 bg-surface">
        <span className="text-[11px] font-medium text-text-secondary">
          Results
          {rows.length > 0 && (
            <span className="ml-1.5 text-[10px] text-text-tertiary">
              ({rows.length})
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 text-text-tertiary hover:text-foreground rounded hover:bg-surface-hover cursor-pointer"
          title={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand results" : "Collapse results"}
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
            {collapsed ? (
              <polyline points="6 9 12 15 18 9" />
            ) : (
              <polyline points="6 15 12 9 18 15" />
            )}
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-auto">
          {columns.length === 0 ? (
            <div className="p-4 text-xs text-text-tertiary">
              Run a query to see results here.
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-3 py-1.5 text-[10px] text-text-tertiary border-b border-sidebar-border shrink-0">
                {notice} &middot; {rows.length} row{rows.length !== 1 ? "s" : ""}
              </div>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface sticky top-0">
                    <tr>
                      {columns.map((c) => (
                        <th
                          key={c}
                          className="text-left px-3 py-1.5 border-b border-sidebar-border font-medium text-text-secondary"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={`row-${idx}`}
                        className="border-b border-sidebar-border/60"
                      >
                        {columns.map((c) => (
                          <td
                            key={`${idx}-${c}`}
                            className="px-3 py-1.5 text-foreground align-top"
                          >
                            {String(row[c] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
