"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import { useEditorStore } from "@/lib/store";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false }
);

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  { ssr: false }
);

interface SqlEditorSlideOutProps {
  filePath: string;
  onClose: () => void;
  onOpenInCodeMode: () => void;
}

export function SqlEditorSlideOut({
  filePath,
  onClose,
  onOpenInCodeMode,
}: SqlEditorSlideOutProps) {
  const files = useEditorStore((s) => s.files);
  const updateContent = useEditorStore((s) => s.updateContent);
  const saveFile = useEditorStore((s) => s.saveFile);
  const darkMode = useEditorStore((s) => s.darkMode);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [closing, setClosing] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const file = files[filePath];
  const fileName = filePath.split("/").pop() ?? filePath;
  const hasChanges = file ? file.content !== file.savedContent : false;

  // Extract task config summary from file path
  const folderParts = filePath.split("/");
  const stage = folderParts.length > 1 ? folderParts[folderParts.length - 2] : "";

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        saveFile(filePath);
      });
    },
    [filePath, saveFile]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        updateContent(filePath, value);
      }
    },
    [filePath, updateContent]
  );

  const handleSave = useCallback(() => {
    saveFile(filePath);
  }, [filePath, saveFile]);

  if (!file) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        onClick={handleClose}
      />

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-1/2 min-w-[480px] max-w-[800px] flex flex-col bg-background border-l border-sidebar-border shadow-2xl transition-transform duration-200 ease-out ${
          closing ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          animation: closing ? undefined : "slideout-in 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border bg-surface shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* SQL file icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent shrink-0"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {fileName}
              </h3>
              <p className="text-[11px] text-text-tertiary truncate">
                {filePath}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenInCodeMode}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 bg-accent/10 hover:bg-accent/15 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Open in Code Mode
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

        {/* Task config summary bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-sidebar-border bg-surface/50 text-xs text-text-secondary shrink-0">
          {stage && (
            <span className="flex items-center gap-1">
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
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {stage}
            </span>
          )}
          <span className="flex items-center gap-1">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Status: {file.status}
          </span>
          {hasChanges && (
            <span className="text-badge-pending flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-badge-pending" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* Monaco Editor or Diff */}
        <div className="flex-1 min-h-0">
          {showDiff ? (
            <MonacoDiffEditor
              original={file.savedContent}
              modified={file.content}
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
              key={filePath}
              defaultValue={file.content}
              language="sql"
              theme={darkMode ? "vs-dark" : "light"}
              onChange={handleChange}
              onMount={handleMount}
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

        {/* Footer with Save button */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-sidebar-border bg-surface shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">
              {hasChanges ? "Unsaved changes" : "All changes saved"}
            </span>
            <button
              onClick={() => setShowDiff((d) => !d)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
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
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              hasChanges
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
            Save
          </button>
        </div>
      </div>

      {/* Keyframe for initial slide-in */}
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
