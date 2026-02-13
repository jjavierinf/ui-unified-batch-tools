"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { useWorkspaceStore, ViewMode } from "@/lib/workspace-store";
import { UnifiedHeader } from "./UnifiedHeader";
import { CodeView } from "./CodeView";
import { PipelineView } from "./PipelineView";
import { ApprovalsView } from "./ApprovalsView";
import { SafetyGuardrailsView } from "./SafetyGuardrailsView";
import { DashboardView } from "./DashboardView";
import { ChangesSidebar } from "./ChangesSidebar";

export function WorkspaceShell() {
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const restoreViewMode = useWorkspaceStore((s) => s.restoreViewMode);
  const changesPanelOpen = useEditorStore((s) => s.changesPanelOpen);

  // Seed current view into history on mount + listen for back/forward
  useEffect(() => {
    // Replace the initial entry so the first state has viewMode
    window.history.replaceState({ viewMode }, "", undefined);

    const onPopState = (ev: PopStateEvent) => {
      const mode = ev.state?.viewMode as ViewMode | undefined;
      if (mode) restoreViewMode(mode);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <UnifiedHeader />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          {viewMode === "home" ? (
            <DashboardView />
          ) : viewMode === "code" ? (
            <CodeView />
          ) : viewMode === "pipeline" ? (
            <PipelineView />
          ) : viewMode === "safety" ? (
            <SafetyGuardrailsView />
          ) : (
            <ApprovalsView />
          )}
        </div>
        {changesPanelOpen && <ChangesSidebar />}
      </div>
    </div>
  );
}
