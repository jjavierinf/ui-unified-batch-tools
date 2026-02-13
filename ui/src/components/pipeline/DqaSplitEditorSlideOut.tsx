"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type { PipelineTask } from "@/lib/types";
import { useEditorStore } from "@/lib/store";
import { getDqaCompareFilePaths } from "@/lib/task-files";
import { StatusBadge } from "@/components/StatusBadge";
import { getStatusUi } from "@/lib/status-ui";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false }
);

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  { ssr: false }
);

interface DqaSplitEditorSlideOutProps {
  task: PipelineTask;
  onClose: () => void;
}

export function DqaSplitEditorSlideOut({ task, onClose }: DqaSplitEditorSlideOutProps) {
  const files = useEditorStore((s) => s.files);
  const updateContent = useEditorStore((s) => s.updateContent);
  const saveFile = useEditorStore((s) => s.saveFile);
  const darkMode = useEditorStore((s) => s.darkMode);

  const sourceEditorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const targetEditorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const compare = useMemo(() => getDqaCompareFilePaths(task), [task]);
  const [closing, setClosing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const sourcePath = compare?.sourcePath ?? "";
  const targetPath = compare?.targetPath ?? "";

  const sourceFile = sourcePath ? files[sourcePath] : undefined;
  const targetFile = targetPath ? files[targetPath] : undefined;

  const sourceName = sourcePath.split("/").pop() ?? sourcePath;
  const targetName = targetPath.split("/").pop() ?? targetPath;

  const sourceHasChanges = !!sourceFile && sourceFile.content !== sourceFile.savedContent;
  const targetHasChanges = !!targetFile && targetFile.content !== targetFile.savedContent;
  const anyChanges = sourceHasChanges || targetHasChanges;

  const sourceConn = task.taskConfig?.connection?.source ?? "source_conn";
  const targetConn = task.taskConfig?.connection?.target ?? "target_conn";

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const handleMountSource: OnMount = useCallback(
    (editor, monaco) => {
      sourceEditorRef.current = editor;
      if (!sourcePath) return;
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        saveFile(sourcePath);
      });
    },
    [saveFile, sourcePath]
  );

  const handleMountTarget: OnMount = useCallback(
    (editor, monaco) => {
      targetEditorRef.current = editor;
      if (!targetPath) return;
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        saveFile(targetPath);
      });
    },
    [saveFile, targetPath]
  );

  const handleChange = useCallback(
    (path: string, value: string | undefined) => {
      if (value === undefined) return;
      if (!path) return;
      updateContent(path, value);
    },
    [updateContent]
  );

  const handleSaveBoth = useCallback(() => {
    if (sourcePath && sourceFile && sourceHasChanges) saveFile(sourcePath);
    if (targetPath && targetFile && targetHasChanges) saveFile(targetPath);
  }, [saveFile, sourceFile, sourceHasChanges, sourcePath, targetFile, targetHasChanges, targetPath]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        onClick={handleClose}
      />

      {/* Slide-out */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[72%] min-w-[920px] max-w-[1280px] flex flex-col bg-background border-l border-sidebar-border shadow-2xl transition-transform duration-200 ease-out ${
          closing ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          animation: closing ? undefined : "slideout-in 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-surface shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              DQA: source vs target · {task.name}
            </h3>
            <p className="text-[11px] text-text-tertiary truncate">
              {sourceConn} → {targetConn}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDiff((d) => !d)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                showDiff
                  ? "bg-accent/15 text-accent"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover"
              }`}
              title="Toggle diff view"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" /><path d="M5 12h14" />
              </svg>
              Diff
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-secondary hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              title="Close (Esc)"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-sidebar-border bg-surface/50 text-xs text-text-secondary shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-text-tertiary">Files</span>
            {!compare ? (
              <span className="text-text-tertiary">
                Missing DQA compare config in scaffold task.
              </span>
            ) : (
              <>
                <span className="truncate" title={sourcePath}>
                  {sourceName}
                </span>
                {sourceFile && (
                  <span title={getStatusUi(sourceFile.status).meaning}>
                    <StatusBadge status={sourceFile.status} />
                  </span>
                )}
                <span className="text-text-tertiary">·</span>
                <span className="truncate" title={targetPath}>
                  {targetName}
                </span>
                {targetFile && (
                  <span title={getStatusUi(targetFile.status).meaning}>
                    <StatusBadge status={targetFile.status} />
                  </span>
                )}
              </>
            )}
          </div>
          {anyChanges && (
            <span className="text-badge-pending flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-badge-pending" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* Editors */}
        <div className="flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 border-r border-sidebar-border flex flex-col">
            <div className="px-4 py-2 border-b border-sidebar-border bg-background/40">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                Source query
              </p>
              <p className="text-xs text-foreground mt-0.5 truncate">
                {sourceConn}
                {compare ? ` · ${sourceName}` : ""}
              </p>
            </div>
            <div className="flex-1 min-h-0">
              {!compare ? (
                <div className="h-full flex items-center justify-center text-sm text-text-tertiary text-center px-6">
                  This DQA task is configured as a compare task, but the scaffold
                  is missing the `sourceQueryFile`/`targetQueryFile` mapping.
                </div>
              ) : !sourceFile ? (
                <div className="h-full flex items-center justify-center text-sm text-text-tertiary">
                  Missing source SQL file in scaffold store.
                </div>
              ) : showDiff ? (
                <MonacoDiffEditor
                  original={sourceFile.savedContent}
                  modified={sourceFile.content}
                  language="sql"
                  theme={darkMode ? "vs-dark" : "light"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    readOnly: true,
                    scrollBeyondLastLine: false,
                    renderSideBySide: true,
                    automaticLayout: true,
                  }}
                />
              ) : (
                <MonacoEditor
                  key={sourcePath}
                  defaultValue={sourceFile.content}
                  language="sql"
                  theme={darkMode ? "vs-dark" : "light"}
                  onChange={(v) => handleChange(sourcePath, v)}
                  onMount={handleMountSource}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 8 },
                    automaticLayout: true,
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-4 py-2 border-b border-sidebar-border bg-background/40">
              <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
                Target query
              </p>
              <p className="text-xs text-foreground mt-0.5 truncate">
                {targetConn}
                {compare ? ` · ${targetName}` : ""}
              </p>
            </div>
            <div className="flex-1 min-h-0">
              {!compare ? (
                <div className="h-full flex items-center justify-center text-sm text-text-tertiary text-center px-6">
                  Configure a compare-style DQA task to unlock the split editor.
                </div>
              ) : !targetFile ? (
                <div className="h-full flex items-center justify-center text-sm text-text-tertiary">
                  Missing target SQL file in scaffold store.
                </div>
              ) : showDiff ? (
                <MonacoDiffEditor
                  original={targetFile.savedContent}
                  modified={targetFile.content}
                  language="sql"
                  theme={darkMode ? "vs-dark" : "light"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    readOnly: true,
                    scrollBeyondLastLine: false,
                    renderSideBySide: true,
                    automaticLayout: true,
                  }}
                />
              ) : (
                <MonacoEditor
                  key={targetPath}
                  defaultValue={targetFile.content}
                  language="sql"
                  theme={darkMode ? "vs-dark" : "light"}
                  onChange={(v) => handleChange(targetPath, v)}
                  onMount={handleMountTarget}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 8 },
                    automaticLayout: true,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-sidebar-border bg-surface shrink-0">
          <span className="text-xs text-text-tertiary">
            Ctrl/Cmd+S saves the focused editor.
          </span>
          <button
            onClick={handleSaveBoth}
            disabled={!anyChanges}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              anyChanges
                ? "bg-accent text-white hover:bg-accent/90"
                : "bg-surface-hover text-text-tertiary cursor-not-allowed"
            }`}
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
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save both
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideout-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
