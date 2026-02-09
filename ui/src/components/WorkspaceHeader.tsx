"use client";

import Link from "next/link";
import { useEditorStore } from "@/lib/store";
import { EnvironmentToggle } from "./EnvironmentToggle";
import { ThemeToggle } from "./ThemeToggle";

export function WorkspaceHeader() {
  const files = useEditorStore((s) => s.files);
  const saveFile = useEditorStore((s) => s.saveFile);

  const modifiedFiles = Object.entries(files).filter(
    ([, f]) => f.content !== f.savedContent
  );
  const modifiedCount = modifiedFiles.length;
  const hasChanges = modifiedCount > 0;

  const handleSaveAll = () => {
    for (const [path] of modifiedFiles) {
      saveFile(path);
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface border-b border-sidebar-border shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
          Workspace
        </span>
        <span className="text-sm font-semibold text-foreground">
          SQL models
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/pipelines"
          className="text-xs text-text-secondary hover:text-foreground transition-colors"
        >
          Orchestration &rarr;
        </Link>

        <EnvironmentToggle />
        <ThemeToggle />

        <button
          onClick={handleSaveAll}
          disabled={!hasChanges}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            hasChanges
              ? "bg-accent text-white hover:bg-accent/80"
              : "bg-surface-hover text-text-tertiary cursor-not-allowed"
          }`}
        >
          Save changes
          {hasChanges && (
            <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
              {modifiedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
