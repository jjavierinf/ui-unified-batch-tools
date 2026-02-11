import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "code" | "pipeline" | "approvals";
export type PipelineSubMode = "simple" | "pro";

interface WorkspaceStore {
  viewMode: ViewMode;
  pipelineSubMode: PipelineSubMode;
  setViewMode: (mode: ViewMode) => void;
  setPipelineSubMode: (mode: PipelineSubMode) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      viewMode: "code",
      pipelineSubMode: "simple",
      setViewMode: (mode) => set({ viewMode: mode }),
      setPipelineSubMode: (mode) => set({ pipelineSubMode: mode }),
    }),
    { name: "workspace-store-v1" }
  )
);
