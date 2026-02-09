"use client";

import { useEditorStore } from "@/lib/store";

export function EditorActionButtons() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const environment = useEditorStore((s) => s.environment);
  const submitFile = useEditorStore((s) => s.submitFile);
  const saveFile = useEditorStore((s) => s.saveFile);

  const file = selectedFile ? files[selectedFile] : null;
  const isModified = file ? file.content !== file.savedContent : false;
  const canSubmit = file ? isModified || file.status === "draft" : false;

  const submitLabel =
    environment === "dev" ? "Submit to Dev" : "Submit to Prod";

  const handleSubmit = () => {
    if (selectedFile && canSubmit) {
      submitFile(selectedFile);
    }
  };

  const handleSave = () => {
    if (selectedFile && isModified) {
      saveFile(selectedFile);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
      {/* Save button (only when modified) */}
      {isModified && (
        <div className="group relative">
          <button
            onClick={handleSave}
            className="w-9 h-9 rounded-full flex items-center justify-center text-foreground bg-surface border border-sidebar-border shadow-md hover:bg-surface-hover hover:scale-105 transition-all cursor-pointer"
            aria-label="Save file"
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
          </button>
          <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-foreground text-background text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Save (Cmd+S)
          </span>
        </div>
      )}

      {/* Submit button */}
      <div className="relative group">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`h-9 rounded-full flex items-center gap-1.5 px-4 text-xs font-medium shadow-md transition-all ${
            canSubmit
              ? "bg-accent text-white hover:bg-accent/80 hover:scale-105 cursor-pointer"
              : "bg-surface border border-sidebar-border text-text-tertiary cursor-not-allowed"
          }`}
          aria-label={submitLabel}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {environment === "dev" ? "Dev" : "Prod"}
        </button>

        {/* Tooltip */}
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-foreground text-background text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {submitLabel}
        </span>
      </div>
    </div>
  );
}
