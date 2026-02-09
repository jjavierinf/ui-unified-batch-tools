"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PipelineHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-surface border-b border-sidebar-border shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
          Tasks
        </span>
        <span className="text-sm font-semibold text-foreground">
          Orchestration
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/editor"
          className="text-xs text-text-secondary hover:text-foreground transition-colors"
        >
          SQL Editor &rarr;
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
