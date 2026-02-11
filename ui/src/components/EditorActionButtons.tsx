"use client";

import { useEditorStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";

export function EditorActionButtons() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const saveFile = useEditorStore((s) => s.saveFile);

  const addToast = useToastStore((s) => s.addToast);

  const file = selectedFile ? files[selectedFile] : null;
  const isModified = file ? file.content !== file.savedContent : false;

  const handleSave = () => {
    if (selectedFile && isModified) {
      saveFile(selectedFile);
      const filename = selectedFile.split("/").pop() ?? selectedFile;
      addToast(`${filename} saved`);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
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
    </div>
  );
}
