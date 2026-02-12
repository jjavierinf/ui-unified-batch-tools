"use client";

import { useWorkspaceStore } from "@/lib/workspace-store";
import { UnifiedHeader } from "./UnifiedHeader";
import { CodeView } from "./CodeView";
import { PipelineView } from "./PipelineView";
import { ApprovalsView } from "./ApprovalsView";
import { WhatNewGuide } from "./WhatNewGuide";
import { SafetyEnforcesView } from "./SafetyEnforcesView";

export function WorkspaceShell() {
  const viewMode = useWorkspaceStore((s) => s.viewMode);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <UnifiedHeader />
      <WhatNewGuide />
      {viewMode === "code" ? (
        <CodeView />
      ) : viewMode === "pipeline" ? (
        <PipelineView />
      ) : viewMode === "safety" ? (
        <SafetyEnforcesView />
      ) : (
        <ApprovalsView />
      )}
    </div>
  );
}
