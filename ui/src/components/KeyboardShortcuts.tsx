"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";

const shortcuts = [
  { keys: ["Cmd", "P"], description: "Quick file search" },
  { keys: ["Cmd", "S"], description: "Save current file" },
  { keys: ["Cmd", "?"], description: "Show keyboard shortcuts" },
  { keys: ["Tab"], description: "Navigate between elements" },
  { keys: ["Space"], description: "Toggle folder / select file" },
  { keys: ["Enter"], description: "Confirm selection" },
  { keys: ["Esc"], description: "Close dialog / cancel" },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 text-[11px] font-medium bg-surface-hover border border-sidebar-border rounded text-text-secondary">
      {children}
    </kbd>
  );
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const saveFile = useEditorStore((s) => s.saveFile);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+? or Cmd+Shift+/ → toggle shortcut overlay
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "/") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Cmd+S → save current file
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (selectedFile) {
          const file = files[selectedFile];
          if (file && file.content !== file.savedContent) {
            saveFile(selectedFile);
            const filename = selectedFile.split("/").pop() ?? selectedFile;
            addToast(`${filename} saved`);
          }
        }
        return;
      }

      // Esc → close overlay
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedFile, files, saveFile, addToast]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm bg-surface border border-sidebar-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          <h2 className="text-sm font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="w-5 h-5 flex items-center justify-center rounded text-text-tertiary hover:text-foreground cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-[10px] text-text-tertiary">+</span>}
                    <Kbd>{key === "Cmd" ? "\u2318" : key}</Kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-sidebar-border bg-surface-hover/50">
          <p className="text-[10px] text-text-tertiary text-center">
            Press <Kbd>Esc</Kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
