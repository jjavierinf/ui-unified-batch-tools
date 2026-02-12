import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SafetyEnforcesConfig {
  maxRuntimeMsExplorer: number;
  maxRuntimeMsPipes: number;
  minIdlePctExplorer: number;
  minIdlePctPipes: number;
  defaultLimitRowsExplorer: number;
}

interface SafetyStore {
  config: SafetyEnforcesConfig;
  update: (patch: Partial<SafetyEnforcesConfig>) => void;
  resetToDefaults: () => void;
}

export const DEFAULT_SAFETY: SafetyEnforcesConfig = {
  maxRuntimeMsExplorer: 12_000,
  maxRuntimeMsPipes: 60_000,
  minIdlePctExplorer: 25,
  minIdlePctPipes: 40,
  defaultLimitRowsExplorer: 500,
};

export const useSafetyStore = create<SafetyStore>()(
  persist(
    (set) => ({
      config: DEFAULT_SAFETY,
      update: (patch) =>
        set((state) => ({ config: { ...state.config, ...patch } })),
      resetToDefaults: () => set({ config: DEFAULT_SAFETY }),
    }),
    { name: "safety-store-v1" }
  )
);

