"use client";

import { useEditorStore } from "@/lib/store";
import { useWorkspaceStore, ViewMode } from "@/lib/workspace-store";
import { useAuthStore } from "@/lib/auth-store";
import { EnvironmentToggle } from "./EnvironmentToggle";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { BranchIndicator } from "./git/BranchIndicator";

const baseTabs: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    key: "code",
    label: "SQL Editor",
    icon: (
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
    ),
  },
  {
    key: "pipeline",
    label: "Pipelines",
    icon: (
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
    ),
  },
];

const reviewsTab: { key: ViewMode; label: string; icon: React.ReactNode } = {
  key: "approvals",
  label: "Reviews",
  icon: (
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export function UnifiedHeader() {
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const files = useEditorStore((s) => s.files);
  const saveFile = useEditorStore((s) => s.saveFile);
  const currentUser = useAuthStore((s) => s.currentUser);

  const isLeader = currentUser?.role === "leader";
  const tabs = isLeader ? [...baseTabs, reviewsTab] : baseTabs;

  const pendingCount = Object.values(files).filter(
    (f) => f.status === "pending_approval"
  ).length;

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
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 ${
              viewMode === tab.key
                ? "text-foreground border-accent"
                : "text-text-secondary hover:text-foreground border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "approvals" && pendingCount > 0 && (
              <span className="ml-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-semibold px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <BranchIndicator />
        <EnvironmentToggle />
        <ThemeToggle />
        <UserMenu />

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
