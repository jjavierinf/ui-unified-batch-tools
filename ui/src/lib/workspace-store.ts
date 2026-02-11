import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "code" | "pipeline" | "approvals";

interface WorkspaceStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      viewMode: "code",
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    { name: "workspace-store-v1" }
  )
);
