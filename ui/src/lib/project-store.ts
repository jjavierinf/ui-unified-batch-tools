import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SqlFile, DagConfig, PipelineTask } from "./types";
import { initialFiles, dagConfigs as mainDagConfigs } from "./mock-data";
import { initialPipelineTasks as mainTasks } from "./pipeline-mock-data";

/* ------------------------------------------------------------------ */
/*  Project definition                                                 */
/* ------------------------------------------------------------------ */

export interface Project {
  id: string;
  name: string;
  branch: string;
  description: string;
  files: Record<string, SqlFile>;
  dagConfigs: DagConfig[];
  tasks: PipelineTask[];
}

/* ------------------------------------------------------------------ */
/*  Simple DQA project — 1 pipeline, both DQA types                    */
/* ------------------------------------------------------------------ */

function sf(content: string): SqlFile {
  return { content, savedContent: content, status: "saved_local" };
}

const SIMPLE_FILES: Record<string, SqlFile> = {
  // ── data_validation pipeline (DQA-focused) ──
  "dags/quality_checks/data_validation/extract/extract_validation_set.sql": sf(
    `-- Extract a validation sample from source\nSELECT *\nFROM src.transactions_raw\nWHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\nORDER BY updated_at DESC\nLIMIT 10000\n;`
  ),
  "dags/quality_checks/data_validation/transform/transform_validation_set.sql": sf(
    `-- Deduplicate and enrich validation data\nINSERT INTO db_stage.transactions_validated\nSELECT DISTINCT\n  t.id,\n  t.amount,\n  t.currency,\n  t.created_at,\n  t.updated_at,\n  CASE WHEN t.amount > 0 THEN 'credit' ELSE 'debit' END AS direction\nFROM db_stage.transactions_raw t\nWHERE t.updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\n;`
  ),
  "dags/quality_checks/data_validation/load/load_validation_set.sql": sf(
    `-- Load validated data into data model\nINSERT INTO db_data_model.transactions\nSELECT *\nFROM db_stage.transactions_validated\nWHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\n;`
  ),
  // DQA type A — single query rule check
  "dags/quality_checks/data_validation/dqa/single_count_check.sql": sf(
    `-- DQA: Single count sanity check\n-- Ensures the target table has a reasonable row count\nSELECT\n  COUNT(*) AS total_rows,\n  COUNT(DISTINCT id) AS unique_ids,\n  MIN(updated_at) AS oldest_record,\n  MAX(updated_at) AS newest_record,\n  CASE\n    WHEN COUNT(*) = 0 THEN 'EMPTY_TABLE'\n    WHEN COUNT(*) <> COUNT(DISTINCT id) THEN 'DUPLICATES_FOUND'\n    WHEN DATEDIFF(NOW(), MAX(updated_at)) > 2 THEN 'STALE_DATA'\n    ELSE 'PASS'\n  END AS status\nFROM db_data_model.transactions\n;`
  ),
  // DQA type B — source vs target (two files)
  "dags/quality_checks/data_validation/dqa/source_transactions_count_by_day.sql": sf(
    `-- DQA type B (source query): count per day in source\nSELECT\n  CAST(updated_at AS DATE) AS day,\n  COUNT(*) AS cnt\nFROM src.transactions_raw\nWHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 7 DAY)\nGROUP BY 1\nORDER BY 1\n;`
  ),
  "dags/quality_checks/data_validation/dqa/target_transactions_count_by_day.sql": sf(
    `-- DQA type B (target query): count per day in target\nSELECT\n  CAST(updated_at AS DATE) AS day,\n  COUNT(*) AS cnt\nFROM db_data_model.transactions\nWHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 7 DAY)\nGROUP BY 1\nORDER BY 1\n;`
  ),
};

const SIMPLE_DAG_CONFIGS: DagConfig[] = [
  {
    dagName: "dag_quality_checks_data_validation",
    integrationName: "quality_checks",
    schedule: "30 */6 * * *",
    tags: ["quality_checks", "dqa", "validation"],
    dagType: "snapshot",
    owner: "owner_dqa_1",
    startDate: "2025-06-01",
    timezone: "UTC",
    team: "team_data_quality",
    incidentsChannel: "#incidents-dqa",
    alertsChannel: "#alerts-dqa",
  },
];

const SIMPLE_TASKS: PipelineTask[] = [
  {
    id: "dqa-val-1",
    name: "extract_validation_set",
    dagName: "dag_quality_checks_data_validation",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/quality_checks/data_validation/extract/extract_validation_set.sql",
    order: 1,
  },
  {
    id: "dqa-val-2",
    name: "transform_validation_set",
    dagName: "dag_quality_checks_data_validation",
    stage: "transform",
    taskType: "snapshot",
    sqlFilePath: "dags/quality_checks/data_validation/transform/transform_validation_set.sql",
    order: 2,
  },
  {
    id: "dqa-val-3",
    name: "load_validation_set",
    dagName: "dag_quality_checks_data_validation",
    stage: "load",
    taskType: "snapshot",
    sqlFilePath: "dags/quality_checks/data_validation/load/load_validation_set.sql",
    order: 3,
  },
  // DQA type A — single query
  {
    id: "dqa-val-4",
    name: "single_count_check",
    dagName: "dag_quality_checks_data_validation",
    stage: "dqa",
    taskType: "snapshot",
    sqlFilePath: "dags/quality_checks/data_validation/dqa/single_count_check.sql",
    order: 4,
  },
  // DQA type B — source vs target (like dqa_inventory_source_vs_target_counts)
  {
    id: "dqa-val-5",
    name: "dqa_validation_source_vs_target_counts",
    dagName: "dag_quality_checks_data_validation",
    stage: "dqa",
    taskType: "snapshot",
    sqlFilePath: "dags/quality_checks/data_validation/dqa/source_transactions_count_by_day.sql",
    order: 5,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "postgres_dqa_src", target: "warehouse_postgres" },
      query: { file: "source_transactions_count_by_day.sql", timezone: "UTC" },
      dqa: {
        queryType: "source_vs_target_query_comparison",
        alertKind: "error",
        tolerance: 0.01,
        sourceQueryFile: "source_transactions_count_by_day.sql",
        targetQueryFile: "target_transactions_count_by_day.sql",
        comparisonMetric: "count_per_day",
        groupBy: ["day"],
      },
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Projects registry                                                  */
/* ------------------------------------------------------------------ */

export const PROJECTS: Project[] = [
  {
    id: "main-workspace",
    name: "Retail Platform",
    branch: "feature/retail-pipelines",
    description: "5 pipelines — ecom, store POS, ad platform",
    files: initialFiles,
    dagConfigs: mainDagConfigs,
    tasks: mainTasks,
  },
  {
    id: "dqa-project",
    name: "DQA Validation",
    branch: "feature/dqa-checks",
    description: "1 pipeline — data validation with both DQA types",
    files: SIMPLE_FILES,
    dagConfigs: SIMPLE_DAG_CONFIGS,
    tasks: SIMPLE_TASKS,
  },
];

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface ProjectStore {
  activeProjectId: string;
  customProjects: Project[];
  switchProject: (id: string) => void;
  createProject: (name: string) => string;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      activeProjectId: PROJECTS[0].id,
      customProjects: [],
      switchProject: (id) => set({ activeProjectId: id }),
      createProject: (name) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const id = `custom-${slug}-${Date.now()}`;
        const project: Project = {
          id,
          name,
          branch: `feature/${slug}`,
          description: "Empty project",
          files: {},
          dagConfigs: [],
          tasks: [],
        };
        set({ customProjects: [...get().customProjects, project] });
        return id;
      },
    }),
    { name: "project-store-v1" }
  )
);

export function getAllProjects(customProjects: Project[]): Project[] {
  return [...PROJECTS, ...customProjects];
}

export function getActiveProject(id: string, customProjects: Project[] = []): Project {
  const all = getAllProjects(customProjects);
  return all.find((p) => p.id === id) ?? PROJECTS[0];
}
