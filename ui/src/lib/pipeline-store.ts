import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PipelineTask, DagConfig, TaskConfig } from "./types";
import { initialPipelineTasks } from "./pipeline-mock-data";
import { dagConfigs as initialDagConfigs } from "./mock-data";
import { isDdlTask } from "./task-type-utils";

interface CreatePipelineInput {
  integrationName: string;
  pipelineName: string;
  dagType: "snapshot" | "incremental";
  schedule: string;
  owner?: string;
  timezone?: string;
}

interface CreatePipelineResult {
  dagName: string;
  displayFolder: string;
  rootFolderPath: string;
  files: Array<{ path: string; content: string }>;
}

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
  updateDagField: (dagName: string, field: string, value: string) => void;
  updateTaskConfig: (taskId: string, config: TaskConfig) => void;
  createPipeline: (input: CreatePipelineInput) => CreatePipelineResult;
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

          const visibleTasks = dagTasks.filter(
            (t) => !isDdlTask(t.name, t.sqlFilePath)
          );
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= visibleTasks.length ||
            toIndex >= visibleTasks.length
          ) {
            return state;
          }

          const [moved] = visibleTasks.splice(fromIndex, 1);
          visibleTasks.splice(toIndex, 0, moved);

          let cursor = 0;
          const merged = dagTasks.map((task) => {
            if (isDdlTask(task.name, task.sqlFilePath)) return task;
            const next = visibleTasks[cursor];
            cursor += 1;
            return next;
          });

          const reordered = merged.map((t, i) => ({ ...t, order: i + 1 }));
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

      updateDagField: (dagName, field, value) =>
        set((state) => ({
          dagConfigs: state.dagConfigs.map((d) =>
            d.dagName === dagName ? { ...d, [field]: value } : d
          ),
        })),

      updateTaskConfig: (taskId, config) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, taskConfig: { ...t.taskConfig, ...config } } : t
          ),
        })),

      createPipeline: (input) => {
        const normalize = (value: string) =>
          value
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "")
            .replace(/_+/g, "_");

        const integration = normalize(input.integrationName) || "new_integration";
        const pipeline = normalize(input.pipelineName) || "new_pipeline";
        const dagName = `dag_${integration}_${pipeline}`;
        const displayFolder = pipeline;

        const basePath = `dags/${integration}/${displayFolder}`;
        const fileSeed = [
          {
            path: `${basePath}/extract/extract_task.sql`,
            content:
              "-- Extract stage\nSELECT *\nFROM source_table\nWHERE updated_at >= '{{ ts }}';\n",
          },
          {
            path: `${basePath}/transform/transform_task.sql`,
            content:
              "-- Transform stage\nSELECT *\nFROM stage_table;\n",
          },
          {
            path: `${basePath}/load/load_task.sql`,
            content:
              "-- Load stage\nSELECT *\nFROM transformed_table;\n",
          },
          {
            path: `${basePath}/dqa/dqa_task.sql`,
            content:
              "-- DQA stage\nSELECT COUNT(*) AS row_count\nFROM transformed_table;\n",
          },
        ];

        set((state) => {
          if (state.dagConfigs.some((d) => d.dagName === dagName)) {
            return {
              selectedPipeline: dagName,
            };
          }

          const newDag: DagConfig = {
            dagName,
            integrationName: integration,
            schedule: input.schedule,
            tags: [integration, input.dagType],
            dagType: input.dagType,
            owner: input.owner,
            timezone: input.timezone ?? "UTC",
          };

          const newTasks: PipelineTask[] = [
            {
              id: `${dagName}-extract`,
              name: `extract_${pipeline}`,
              dagName,
              stage: "extract",
              taskType: input.dagType,
              sqlFilePath: fileSeed[0].path,
              order: 1,
              taskConfig: {
                expectedWorkload: "medium",
                targetTableName: `${integration}_${pipeline}`,
                connection: { source: "source_db_conn", target: "target_db_conn" },
                query: { file: "extract_task.sql", timezone: "US/Eastern" },
              },
            },
            {
              id: `${dagName}-transform`,
              name: `transform_${pipeline}`,
              dagName,
              stage: "transform",
              taskType: input.dagType,
              sqlFilePath: fileSeed[1].path,
              order: 2,
              taskConfig: {
                connection: { source: "target_db_conn" },
                query: { file: "transform_task.sql", timezone: "US/Eastern" },
              },
            },
            {
              id: `${dagName}-load`,
              name: `load_${pipeline}`,
              dagName,
              stage: "load",
              taskType: input.dagType,
              sqlFilePath: fileSeed[2].path,
              order: 3,
              taskConfig: {
                connection: { source: "target_db_conn", target: "target_db_conn" },
                query: { file: "load_task.sql", timezone: "US/Eastern" },
                loadTarget: { type: "DB", connection: { target: "target_db_conn" } },
              },
            },
            {
              id: `${dagName}-dqa`,
              name: `dqa_${pipeline}`,
              dagName,
              stage: "dqa",
              taskType: input.dagType,
              sqlFilePath: fileSeed[3].path,
              order: 4,
              taskConfig: {
                connection: { source: "target_db_conn" },
                query: { file: "dqa_task.sql", timezone: "US/Eastern" },
                dqa: {
                  queryType: "single_query_notification",
                  alertKind: "warning",
                  tolerance: 0,
                },
              },
            },
          ];

          return {
            dagConfigs: [...state.dagConfigs, newDag],
            tasks: [...state.tasks, ...newTasks],
            selectedPipeline: dagName,
          };
        });

        return { dagName, displayFolder, rootFolderPath: basePath, files: fileSeed };
      },

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
