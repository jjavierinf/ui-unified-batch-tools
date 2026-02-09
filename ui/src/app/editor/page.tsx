"use client";

import { Sidebar } from "@/components/Sidebar";
import { EditorPanel } from "@/components/EditorPanel";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import { HydrationGuard } from "@/components/HydrationGuard";

export default function EditorPage() {
  return (
    <HydrationGuard>
      <div className="flex flex-col h-full overflow-hidden">
        <WorkspaceHeader />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <EditorPanel />
        </div>
      </div>
    </HydrationGuard>
  );
}
