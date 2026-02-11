"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
import { WorkspaceShell } from "@/components/WorkspaceShell";

export default function EditorPage() {
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);

  useEffect(() => {
    setViewMode("code");
  }, [setViewMode]);

  return <WorkspaceShell />;
}
