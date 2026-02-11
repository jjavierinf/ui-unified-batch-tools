import { PipelineTask } from "./types";
import { isDdlTask } from "./task-type-utils";

// 5 tasks per DAG × 5 DAGs = 25 tasks
// Pattern per DAG: create_table_stage → create_table_data_model → extract_and_load → data_model_task → delete_logs

export const initialPipelineTasks: PipelineTask[] = [
  // ── dag_CRM_integration_dbo_AccountReference (snapshot) ──
  {
    id: "crm-acctref-1",
    name: "ddl_stage_AccountReference",
    dagName: "dag_CRM_integration_dbo_AccountReference",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/AccountReference/sql_files/ddl/create_table_stage.sql",
    order: 1,
  },
  {
    id: "crm-acctref-2",
    name: "ddl_datamodel_AccountReference",
    dagName: "dag_CRM_integration_dbo_AccountReference",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/AccountReference/sql_files/ddl/create_table_data_model.sql",
    order: 2,
  },
  {
    id: "crm-acctref-3",
    name: "extract_crm_accounts",
    dagName: "dag_CRM_integration_dbo_AccountReference",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/AccountReference/sql_files/extract/data_model_task.sql",
    order: 3,
    taskConfig: {
      expectedWorkload: "medium",
      connection: { source: "sqlserver_Accounts", target: "starrocks_conn" },
      query: { file: "extract_crm_accounts.sql", timezone: "US/Eastern" },
    },
  },
  {
    id: "crm-acctref-4",
    name: "transform_account_to_datamodel",
    dagName: "dag_CRM_integration_dbo_AccountReference",
    stage: "transform",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/AccountReference/sql_files/transform/data_model_task.sql",
    order: 4,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "starrocks_conn" },
      query: { file: "data_model_task.sql", timezone: "US/Eastern" },
    },
  },
  {
    id: "crm-acctref-5",
    name: "cleanup_old_account_snapshots",
    dagName: "dag_CRM_integration_dbo_AccountReference",
    stage: "dqa",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/AccountReference/sql_files/dqa/delete_logs.sql",
    order: 5,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "starrocks_conn" },
      query: { file: "delete_logs.sql", timezone: "US/Eastern" },
      dqa: { queryType: "single_query_notification", alertKind: "warning", tolerance: 0 },
    },
  },

  // ── dag_CRM_integration_gc_Game (snapshot) ──
  {
    id: "crm-game-1",
    name: "ddl_stage_Game",
    dagName: "dag_CRM_integration_gc_Game",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/Game/sql_files/ddl/create_table_stage.sql",
    order: 1,
  },
  {
    id: "crm-game-2",
    name: "ddl_datamodel_Game",
    dagName: "dag_CRM_integration_gc_Game",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/Game/sql_files/ddl/create_table_data_model.sql",
    order: 2,
  },
  {
    id: "crm-game-3",
    name: "extract_game_catalog",
    dagName: "dag_CRM_integration_gc_Game",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/Game/sql_files/extract/data_model_task.sql",
    order: 3,
    taskConfig: {
      expectedWorkload: "high",
      connection: { source: "sqlserver_Gaming", target: "starrocks_conn" },
      query: { file: "extract_game_catalog.sql", timezone: "US/Eastern" },
    },
  },
  {
    id: "crm-game-4",
    name: "transform_game_to_datamodel",
    dagName: "dag_CRM_integration_gc_Game",
    stage: "transform",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/Game/sql_files/transform/data_model_task.sql",
    order: 4,
    taskConfig: {
      expectedWorkload: "medium",
      connection: { source: "starrocks_conn" },
      query: { file: "data_model_task.sql", timezone: "US/Eastern" },
    },
  },
  {
    id: "crm-game-5",
    name: "cleanup_old_game_snapshots",
    dagName: "dag_CRM_integration_gc_Game",
    stage: "dqa",
    taskType: "snapshot",
    sqlFilePath: "dags/CRM_integration/Game/sql_files/dqa/delete_logs.sql",
    order: 5,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "starrocks_conn" },
      query: { file: "delete_logs.sql", timezone: "US/Eastern" },
      dqa: { queryType: "single_query_notification", alertKind: "warning", tolerance: 0 },
    },
  },

  // ── dag_CRM_integration_tr_GameTransaction (incremental) ──
  {
    id: "crm-gametx-1",
    name: "create_table_stage",
    dagName: "dag_CRM_integration_tr_GameTransaction",
    stage: "extract",
    taskType: "incremental",
    sqlFilePath: "dags/CRM_integration/GameTransaction/sql_files/ddl/create_table_stage.sql",
    order: 1,
  },
  {
    id: "crm-gametx-2",
    name: "create_table_data_model",
    dagName: "dag_CRM_integration_tr_GameTransaction",
    stage: "extract",
    taskType: "incremental",
    sqlFilePath: "dags/CRM_integration/GameTransaction/sql_files/ddl/create_table_data_model.sql",
    order: 2,
  },
  {
    id: "crm-gametx-3",
    name: "extract_and_load",
    dagName: "dag_CRM_integration_tr_GameTransaction",
    stage: "extract",
    taskType: "incremental",
    sqlFilePath: "dags/CRM_integration/GameTransaction/sql_files/extract/data_model_task.sql",
    order: 3,
    taskConfig: {
      expectedWorkload: "high",
      connection: { source: "sqlserver_Gaming", target: "starrocks_conn" },
      query: { file: "extract_game_transactions.sql", timezone: "US/Eastern" },
      loadTarget: { type: "DB", connection: { target: "starrocks_conn" } },
    },
  },
  {
    id: "crm-gametx-4",
    name: "data_model_task",
    dagName: "dag_CRM_integration_tr_GameTransaction",
    stage: "transform",
    taskType: "incremental",
    sqlFilePath: "dags/CRM_integration/GameTransaction/sql_files/transform/data_model_task.sql",
    order: 4,
    taskConfig: {
      expectedWorkload: "medium",
      connection: { source: "starrocks_conn" },
      query: { file: "data_model_task.sql", timezone: "US/Eastern" },
    },
  },
  {
    id: "crm-gametx-5",
    name: "delete_logs",
    dagName: "dag_CRM_integration_tr_GameTransaction",
    stage: "dqa",
    taskType: "incremental",
    sqlFilePath: "dags/CRM_integration/GameTransaction/sql_files/dqa/delete_logs.sql",
    order: 5,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "starrocks_conn", target: "starrocks_conn" },
      query: { file: "delete_logs.sql", timezone: "US/Eastern" },
      dqa: { queryType: "source_vs_target_query_comparison", alertKind: "error", tolerance: 0 },
    },
  },

  // ── dag_BEATS_integration_dbo_AccountLogType (snapshot) ──
  {
    id: "beats-acctlog-1",
    name: "create_table_stage",
    dagName: "dag_BEATS_integration_dbo_AccountLogType",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/BEATS_integration/AccountLogType/sql_files/extract/data_model_task.sql",
    order: 1,
  },
  {
    id: "beats-acctlog-2",
    name: "create_table_data_model",
    dagName: "dag_BEATS_integration_dbo_AccountLogType",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/BEATS_integration/AccountLogType/sql_files/ddl/create_table_data_model.sql",
    order: 2,
  },
  {
    id: "beats-acctlog-3",
    name: "extract_and_load",
    dagName: "dag_BEATS_integration_dbo_AccountLogType",
    stage: "extract",
    taskType: "snapshot",
    sqlFilePath: "dags/BEATS_integration/AccountLogType/sql_files/ddl/create_table_stage.sql",
    order: 3,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "sqlserver_Accounts", target: "starrocks_conn" },
      query: { file: "extract_account_log_type.sql", timezone: "UTC" },
    },
  },
  {
    id: "beats-acctlog-4",
    name: "data_model_task",
    dagName: "dag_BEATS_integration_dbo_AccountLogType",
    stage: "transform",
    taskType: "snapshot",
    sqlFilePath: "dags/BEATS_integration/AccountLogType/sql_files/transform/data_model_task.sql",
    order: 4,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "starrocks_conn" },
      query: { file: "data_model_task.sql", timezone: "US/Eastern" },
    },
  },
  {
    id: "beats-acctlog-5",
    name: "delete_logs",
    dagName: "dag_BEATS_integration_dbo_AccountLogType",
    stage: "dqa",
    taskType: "snapshot",
    sqlFilePath: "dags/BEATS_integration/AccountLogType/sql_files/dqa/delete_logs.sql",
    order: 5,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "starrocks_conn" },
      query: { file: "delete_logs.sql", timezone: "US/Eastern" },
      dqa: { queryType: "single_query_notification", alertKind: "warning", tolerance: 0 },
    },
  },

  // ── dag_data_sources_tr_DailyTransactionAmount (incremental) ──
  {
    id: "ds-dailytx-1",
    name: "create_table_stage",
    dagName: "dag_data_sources_tr_DailyTransactionAmount",
    stage: "extract",
    taskType: "incremental",
    sqlFilePath: "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/ddl/create_table_stage.sql",
    order: 1,
  },
  {
    id: "ds-dailytx-2",
    name: "create_table_data_model",
    dagName: "dag_data_sources_tr_DailyTransactionAmount",
    stage: "extract",
    taskType: "incremental",
    sqlFilePath: "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/ddl/create_table_data_model.sql",
    order: 2,
  },
  {
    id: "ds-dailytx-3",
    name: "extract_and_load",
    dagName: "dag_data_sources_tr_DailyTransactionAmount",
    stage: "extract",
    taskType: "incremental",
    sqlFilePath: "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/extract/select_from_source.sql",
    order: 3,
    taskConfig: {
      expectedWorkload: "high",
      connection: { source: "sqlserver_Gaming", target: "starrocks_conn" },
      query: { file: "select_from_source.sql", timezone: "US/Eastern" },
      loadTarget: {
        type: "Email",
        connection: { target: "starrocks_conn" },
        to: ["reports@company.com"],
        cc: ["data-team@company.com"],
        subject: "Daily Transaction Amount Report",
        body: "Attached is the daily transaction amount report.",
      },
    },
  },
  {
    id: "ds-dailytx-4",
    name: "data_model_task",
    dagName: "dag_data_sources_tr_DailyTransactionAmount",
    stage: "transform",
    taskType: "incremental",
    sqlFilePath: "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/transform/stage_to_data_model.sql",
    order: 4,
    taskConfig: {
      expectedWorkload: "medium",
      connection: { source: "starrocks_conn" },
      query: { file: "stage_to_data_model.sql", timezone: "US/Eastern" },
    },
  },
  {
    id: "ds-dailytx-5",
    name: "delete_logs",
    dagName: "dag_data_sources_tr_DailyTransactionAmount",
    stage: "dqa",
    taskType: "incremental",
    sqlFilePath: "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/dqa/delete_stage_old_records.sql",
    order: 5,
    taskConfig: {
      expectedWorkload: "low",
      connection: { source: "starrocks_conn" },
      query: { file: "delete_stage_old_records.sql", timezone: "US/Eastern" },
      dqa: { queryType: "single_query_notification", alertKind: "error", tolerance: 0.01 },
    },
  },
];

export function getTasksForPipeline(tasks: PipelineTask[], dagName: string): PipelineTask[] {
  return tasks
    .filter((t) => t.dagName === dagName)
    .sort((a, b) => a.order - b.order);
}

export function getNonDdlTasksForPipeline(tasks: PipelineTask[], dagName: string): PipelineTask[] {
  return tasks
    .filter((t) => t.dagName === dagName && !isDdlTask(t.name, t.sqlFilePath))
    .sort((a, b) => a.order - b.order);
}
