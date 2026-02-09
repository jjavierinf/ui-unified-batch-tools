"use client";

import { useEditorStore } from "@/lib/store";

export function EditorActionButtons() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const environment = useEditorStore((s) => s.environment);
  const submitFile = useEditorStore((s) => s.submitFile);

  const file = selectedFile ? files[selectedFile] : null;
  const isModified = file ? file.content !== file.savedContent : false;
  const canSubmit = file ? isModified || file.status === "draft" : false;

  // Count of files that have unsaved modifications across the store
  const modifiedCount = Object.values(files).filter(
    (f) => f.content !== f.savedContent
  ).length;

  const label =
    environment === "dev" ? "Submit to Dev" : "Submit to Prod";

  const handleSubmit = () => {
    if (selectedFile && canSubmit) {
      submitFile(selectedFile);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
      {/* Submit button */}
      <div className="relative group">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg transition-all ${
            canSubmit
              ? "bg-accent hover:bg-accent/80 hover:scale-105 cursor-pointer"
              : "bg-text-tertiary cursor-not-allowed opacity-60"
          }`}
          aria-label={label}
        >
          &#x2713;
        </button>

        {/* Modified files count badge */}
        {modifiedCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-badge-pending text-white text-[10px] font-bold leading-none">
            {modifiedCount}
          </span>
        )}

        {/* Tooltip */}
        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-foreground text-background text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      </div>
    </div>
  );
}
