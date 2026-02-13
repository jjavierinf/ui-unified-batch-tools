import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "home" | "code" | "pipeline" | "approvals" | "safety";
export type PipelineSubMode = "simple" | "pro";

const VALID_VIEWS = new Set<ViewMode>(["home", "code", "pipeline", "approvals", "safety"]);

interface WorkspaceStore {
  viewMode: ViewMode;
  pipelineSubMode: PipelineSubMode;
  /** Normal navigation — pushes to browser history */
  setViewMode: (mode: ViewMode) => void;
  /** Called from popstate only — updates store WITHOUT pushing history */
  restoreViewMode: (mode: ViewMode) => void;
  setPipelineSubMode: (mode: PipelineSubMode) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      viewMode: "home",
      pipelineSubMode: "simple",
      setViewMode: (mode) => {
        const prev = get().viewMode;
        if (mode === prev) return;
        set({ viewMode: mode });
        if (typeof window !== "undefined") {
          window.history.pushState({ viewMode: mode }, "", undefined);
        }
      },
      restoreViewMode: (mode) => {
        if (VALID_VIEWS.has(mode)) set({ viewMode: mode });
      },
      setPipelineSubMode: (mode) => set({ pipelineSubMode: mode }),
    }),
    { name: "workspace-store-v1" }
  )
);
