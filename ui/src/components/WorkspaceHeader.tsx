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
    <header className="flex items-center justify-between px-4 py-0 bg-surface border-b border-sidebar-border shrink-0">
      <nav className="flex items-center gap-1 h-10">
        <Link
          href="/editor"
          className="flex items-center gap-1.5 px-3 h-full text-xs font-medium text-foreground border-b-2 border-accent"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          SQL Editor
        </Link>
        <Link
          href="/pipelines"
          className="flex items-center gap-1.5 px-3 h-full text-xs font-medium text-text-secondary hover:text-foreground border-b-2 border-transparent transition-colors"
        >
          <svg
            width="13"
            height="13"
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
          Pipelines
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <EnvironmentToggle />
        <ThemeToggle />

        <button
          onClick={handleSaveAll}
          disabled={!hasChanges}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
            hasChanges
              ? "bg-accent text-white hover:bg-accent/80 cursor-pointer"
              : "bg-surface-hover text-text-tertiary cursor-not-allowed"
          }`}
        >
          Save all
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
