"use client";

import { useEditorStore } from "@/lib/store";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { UnifiedHeader } from "./UnifiedHeader";
import { CodeView } from "./CodeView";
import { PipelineView } from "./PipelineView";
import { ApprovalsView } from "./ApprovalsView";
import { WhatNewGuide } from "./WhatNewGuide";
import { SafetyGuardrailsView } from "./SafetyGuardrailsView";
import { DashboardView } from "./DashboardView";
import { ChangesSidebar } from "./ChangesSidebar";

export function WorkspaceShell() {
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const changesPanelOpen = useEditorStore((s) => s.changesPanelOpen);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <UnifiedHeader />
      <WhatNewGuide />
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
