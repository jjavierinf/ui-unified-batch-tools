"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";

export function PipelineHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-0 bg-surface border-b border-sidebar-border shrink-0">
      <nav className="flex items-center gap-1 h-10">
        <Link
          href="/editor"
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          SQL Editor
        </Link>
        <Link
          href="/pipelines"
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
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Pipelines
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
