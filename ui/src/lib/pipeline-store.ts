import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PipelineTask, DagConfig } from "./types";
import { initialPipelineTasks } from "./pipeline-mock-data";
import { dagConfigs as initialDagConfigs } from "./mock-data";

interface PipelineStore {
  tasks: PipelineTask[];
  dagConfigs: DagConfig[];
  selectedPipeline: string | null;

  selectPipeline: (dagName: string | null) => void;
  reorderTask: (dagName: string, fromIndex: number, toIndex: number) => void;
  updateDagSchedule: (dagName: string, schedule: string) => void;
  updateDagTags: (dagName: string, tags: string[]) => void;
  addDagTag: (dagName: string, tag: string) => void;
  removeDagTag: (dagName: string, tag: string) => void;
  resetToDefaults: () => void;
}

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set) => ({
      tasks: initialPipelineTasks,
      dagConfigs: initialDagConfigs,
      selectedPipeline: null,

      selectPipeline: (dagName) => set({ selectedPipeline: dagName }),

      reorderTask: (dagName, fromIndex, toIndex) =>
        set((state) => {
          const dagTasks = state.tasks
            .filter((t) => t.dagName === dagName)
            .sort((a, b) => a.order - b.order);
          const otherTasks = state.tasks.filter((t) => t.dagName !== dagName);

          const [moved] = dagTasks.splice(fromIndex, 1);
          dagTasks.splice(toIndex, 0, moved);

          const reordered = dagTasks.map((t, i) => ({ ...t, order: i + 1 }));
          return { tasks: [...otherTasks, ...reordered] };
        }),

      updateDagSchedule: (dagName, schedule) =>
        set((state) => ({
          dagConfigs: state.dagConfigs.map((d) =>
            d.dagName === dagName ? { ...d, schedule } : d
          ),
        })),

      updateDagTags: (dagName, tags) =>
        set((state) => ({
          dagConfigs: state.dagConfigs.map((d) =>
            d.dagName === dagName ? { ...d, tags } : d
          ),
        })),

      addDagTag: (dagName, tag) =>
        set((state) => ({
          dagConfigs: state.dagConfigs.map((d) =>
            d.dagName === dagName && !d.tags.includes(tag)
              ? { ...d, tags: [...d.tags, tag] }
              : d
          ),
        })),

      removeDagTag: (dagName, tag) =>
        set((state) => ({
          dagConfigs: state.dagConfigs.map((d) =>
            d.dagName === dagName
              ? { ...d, tags: d.tags.filter((t) => t !== tag) }
              : d
          ),
        })),

      resetToDefaults: () =>
        set({
          tasks: initialPipelineTasks,
          dagConfigs: initialDagConfigs,
          selectedPipeline: null,
        }),
    }),
    { name: "pipeline-store-v2" }
  )
);
