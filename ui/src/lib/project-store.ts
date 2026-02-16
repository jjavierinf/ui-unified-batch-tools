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
/*  Simple DQA project — 1 pipeline, 2 DQA tasks                      */
/* ------------------------------------------------------------------ */

function sf(content: string): SqlFile {
  return { content, savedContent: content, status: "saved_local" };
}

const SIMPLE_FILES: Record<string, SqlFile> = {
  "dags/quality_checks/data_validation/extract/extract_validation_set.sql": sf(
    `-- Extract a validation sample from source\nSELECT *\nFROM src.transactions_raw\nWHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\nORDER BY updated_at DESC\nLIMIT 10000\n;`
  ),
  "dags/quality_checks/data_validation/transform/transform_validation_set.sql": sf(
    `-- Deduplicate and enrich validation data\nINSERT INTO db_stage.transactions_validated\nSELECT DISTINCT\n  t.id,\n  t.amount,\n  t.currency,\n  t.created_at,\n  t.updated_at,\n  CASE WHEN t.amount > 0 THEN 'credit' ELSE 'debit' END AS direction\nFROM db_stage.transactions_raw t\nWHERE t.updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\n;`
  ),
  "dags/quality_checks/data_validation/load/load_validation_set.sql": sf(
    `-- Load validated data into data model\nINSERT INTO db_data_model.transactions\nSELECT *\nFROM db_stage.transactions_validated\nWHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\n;`
  ),
  "dags/quality_checks/data_validation/dqa/cross_db_row_count.sql": sf(
    `-- DQA: Cross-database row count comparison\n-- Compares source vs target to detect data loss\nWITH source_count AS (\n  SELECT COUNT(*) AS cnt\n  FROM db_stage.transactions_validated\n  WHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\n),\ntarget_count AS (\n  SELECT COUNT(*) AS cnt\n  FROM db_data_model.transactions\n  WHERE updated_at >= DATE_SUB('{{ ts }}', INTERVAL 1 DAY)\n)\nSELECT\n  s.cnt AS source_rows,\n  t.cnt AS target_rows,\n  ABS(s.cnt - t.cnt) AS diff,\n  CASE\n    WHEN s.cnt = 0 THEN 'NO_SOURCE_DATA'\n    WHEN ABS(s.cnt - t.cnt) > s.cnt * 0.05 THEN 'FAIL'\n    ELSE 'PASS'\n  END AS status\nFROM source_count s\nCROSS JOIN target_count t\n;`
  ),
  "dags/quality_checks/data_validation/dqa/single_count_check.sql": sf(
    `-- DQA: Single count sanity check\n-- Ensures the target table has a reasonable row count\nSELECT\n  COUNT(*) AS total_rows,\n  COUNT(DISTINCT id) AS unique_ids,\n  MIN(updated_at) AS oldest_record,\n  MAX(updated_at) AS newest_record,\n  CASE\n    WHEN COUNT(*) = 0 THEN 'EMPTY_TABLE'\n    WHEN COUNT(*) <> COUNT(DISTINCT id) THEN 'DUPLICATES_FOUND'\n    WHEN DATEDIFF(NOW(), MAX(updated_at)) > 2 THEN 'STALE_DATA'\n    ELSE 'PASS'\n  END AS status\nFROM db_data_model.transactions\n;`
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
  {
    id: "dqa-val-4",
    name: "cross_db_row_count",
    dagName: "dag_quality_checks_data_validation",
    stage: "dqa",
    taskType: "snapshot",
    sqlFilePath: "dags/quality_checks/data_validation/dqa/cross_db_row_count.sql",
    order: 4,
  },
  {
    id: "dqa-val-5",
    name: "single_count_check",
    dagName: "dag_quality_checks_data_validation",
    stage: "dqa",
    taskType: "snapshot",
    sqlFilePath: "dags/quality_checks/data_validation/dqa/single_count_check.sql",
    order: 5,
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
    description: "1 pipeline — cross-DB & count checks",
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
  switchProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: PROJECTS[0].id,
      switchProject: (id) => set({ activeProjectId: id }),
    }),
    { name: "project-store-v1" }
  )
);

export function getActiveProject(id: string): Project {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}
