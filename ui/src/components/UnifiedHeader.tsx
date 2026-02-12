"use client";

import React from "react";
import { useEditorStore } from "@/lib/store";
import { useWorkspaceStore, ViewMode } from "@/lib/workspace-store";
import { useAuthStore } from "@/lib/auth-store";
import { useWhatsNewStore } from "@/lib/whats-new-store";
import { useToastStore } from "@/lib/toast-store";
import { EnvironmentToggle } from "./EnvironmentToggle";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { BranchIndicator } from "./git/BranchIndicator";
import { PushProdConfirmModal } from "./PushProdConfirmModal";

const baseTabs: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    key: "code",
    label: "SQL Explorer",
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
  const environment = useEditorStore((s) => s.environment);
  const saveFile = useEditorStore((s) => s.saveFile);
  const pushToDev = useEditorStore((s) => s.pushToDev);
  const pushToProd = useEditorStore((s) => s.pushToProd);
  const currentUser = useAuthStore((s) => s.currentUser);
  const openWhatsNew = useWhatsNewStore((s) => s.open);
  const addToast = useToastStore((s) => s.addToast);
  const [showProdConfirm, setShowProdConfirm] = React.useState(false);

  const isLeader = currentUser?.role === "leader";
  const tabs = isLeader ? [...baseTabs, reviewsTab] : baseTabs;

  const pendingCount = Object.values(files).filter(
    (f) => f.status === "pending_approval"
  ).length;

  const saveCandidates = Object.entries(files).filter(
    ([, f]) => f.content !== f.savedContent || f.status === "draft"
  );
  const saveCount = saveCandidates.length;
  const canSave = saveCount > 0;
  const pushCandidates = Object.entries(files).filter(([, f]) => {
    if (f.content !== f.savedContent) return false;
    if (environment === "dev") return f.status === "saved_local";
    return f.status === "saved_local" || f.status === "submitted";
  });
  const canPush = pushCandidates.length > 0;

  const handleSaveAll = () => {
    for (const [path] of saveCandidates) {
      saveFile(path);
    }
    if (saveCandidates.length > 0) {
      addToast(`${saveCandidates.length} file(s) saved locally`, "info");
    }
  };

  const handlePush = async () => {
    if (environment === "prod") {
      setShowProdConfirm(true);
      return;
    }

    const result = await pushToDev();
    if (result.pushed === 0) {
      addToast("No saved files ready to push to Dev", "info");
      return;
    }
    addToast(`${result.pushed} file(s) pushed to Dev`);
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-0 bg-surface border-b border-sidebar-border shrink-0">
        <nav className="flex items-center gap-1 h-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              data-tour={
                tab.key === "pipeline"
                  ? "nav-pipelines"
                  : tab.key === "approvals"
                    ? "nav-reviews"
                    : undefined
              }
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
          <button
            onClick={openWhatsNew}
            className="px-2.5 py-1.5 text-[11px] rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer"
          >
            What&apos;s new
          </button>
          <a
            href="/changelog/current"
            target="_blank"
            rel="noreferrer"
            data-tour="whats-new-link-pdf"
            className="px-2.5 py-1.5 text-[11px] rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover"
          >
            Current PDF
          </a>
          <EnvironmentToggle />
          <ThemeToggle />
          <UserMenu />

          <button
            onClick={handleSaveAll}
            data-tour="workspace-save-all"
            disabled={!canSave}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              canSave
                ? "bg-accent text-white hover:bg-accent/80 cursor-pointer"
                : "bg-surface-hover text-text-tertiary cursor-not-allowed"
            }`}
          >
            Save all
            {canSave && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {saveCount}
              </span>
            )}
          </button>

          <button
            onClick={handlePush}
            data-tour="workspace-push"
            disabled={!canPush}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              canPush
                ? environment === "dev"
                  ? "bg-badge-submitted text-white hover:bg-badge-submitted/80 cursor-pointer"
                  : "bg-badge-pending text-black hover:bg-badge-pending/80 cursor-pointer"
                : "bg-surface-hover text-text-tertiary cursor-not-allowed"
            }`}
            title={
              environment === "dev"
                ? "Push saved files to Dev"
                : "Send saved files to review (Prod requires Team Leader approval)"
            }
          >
            Push ({environment === "dev" ? "Dev" : "Prod"})
          </button>
        </div>
      </header>

      {showProdConfirm && (
        <PushProdConfirmModal
          candidates={pushCandidates.map(([path, file]) => ({ path, file }))}
          onCancel={() => setShowProdConfirm(false)}
          onConfirm={async () => {
            setShowProdConfirm(false);
            const result = await pushToProd();
            if (result.pushed === 0) {
              addToast("No saved files ready to push to Prod", "info");
              return;
            }
            const suffix = result.mockPrId ? ` · PR ${result.mockPrId}` : "";
            addToast(`${result.pushed} file(s) sent to review${suffix}`);
          }}
        />
      )}
    </>
  );
}
