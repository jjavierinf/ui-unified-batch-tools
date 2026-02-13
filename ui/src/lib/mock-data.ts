import type { DagConfig, SqlFile } from "./types";
import { anonymizeFiles, deepAnonymize } from "./demo-mode";

function f(content: string): SqlFile {
  return { content, savedContent: content, status: "draft" };
}

type Stage = "ddl" | "extract" | "transform" | "load" | "dqa";

function p(integration: string, pipeline: string, stage: Stage, file: string): string {
  return `dags/${integration}/${pipeline}/${stage}/${file}`;
}

function ddlTable(db: "db_stage" | "db_data_model", tableName: string, columns: string[]): string {
  const cols = columns.map((c) => `  ${c}`).join(",\n");
  return (
    `CREATE TABLE IF NOT EXISTS ${db}.${tableName} (\n` +
    `${cols}\n` +
    `)\n` +
    `PRIMARY KEY (id)\n` +
    `DISTRIBUTED BY HASH (id);\n`
  );
}

const COMMON_COLS = ["id BIGINT", "created_at DATETIME", "updated_at DATETIME"] as const;

const ORDER_COLS = [
  ...COMMON_COLS,
  "customer_id BIGINT",
  "order_total DECIMAL(10,2)",
  "currency STRING",
  "order_status STRING",
];

const CUSTOMER_COLS = [
  ...COMMON_COLS,
  "email_hash STRING",
  "country STRING",
  "loyalty_tier STRING",
];

const INVENTORY_COLS = [
  ...COMMON_COLS,
  "sku STRING",
  "warehouse_id STRING",
  "qty_on_hand INT",
];

const STORE_SALES_COLS = [
  ...COMMON_COLS,
  "store_id STRING",
  "sale_total DECIMAL(10,2)",
  "payment_method STRING",
];

const CAMPAIGN_COLS = [
  ...COMMON_COLS,
  "campaign_id STRING",
  "impressions INT",
  "clicks INT",
  "spend DECIMAL(10,2)",
];

function ddlBiCustom(tableName: string): string {
  return (
    `-- BI custom DDL (scaffold example)\n` +
    `ALTER TABLE db_data_model.${tableName}\n` +
    `ADD COLUMN IF NOT EXISTS demo_note STRING\n` +
    `;\n`
  );
}

function extractQuery(sourceTable: string): string {
  return (
    `-- Extract stage (example)\n` +
    `SELECT *\n` +
    `FROM ${sourceTable}\n` +
    `WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 HOUR)\n` +
    `;\n`
  );
}

function transformQuery(stageTable: string, modelTable: string): string {
  return (
    `-- Transform stage (example)\n` +
    `-- In real life this might also normalize fields, enrich dimensions, etc.\n` +
    `INSERT INTO db_data_model.${modelTable}\n` +
    `SELECT *\n` +
    `FROM db_stage.${stageTable}\n` +
    `WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 DAY)\n` +
    `;\n`
  );
}

function cleanupQuery(stageTable: string): string {
  return (
    `-- Cleanup (NOT DQA)\n` +
    `DELETE FROM db_stage.${stageTable}\n` +
    `WHERE updated_at < DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 30 DAY)\n` +
    `;\n`
  );
}

function loadQuery(stageTable: string, modelTable: string): string {
  return (
    `-- Load stage (example)\n` +
    `-- For a scaffold demo we keep it simple: stage -> model.\n` +
    `INSERT INTO db_data_model.${modelTable}\n` +
    `SELECT *\n` +
    `FROM db_stage.${stageTable}\n` +
    `WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 DAY)\n` +
    `;\n`
  );
}

function dqaRuleCheck(tableName: string): string {
  return (
    `-- DQA type A: single-query rule check (same DB)\n` +
    `-- Alert if there are rows where updated_at is before created_at.\n` +
    `SELECT\n` +
    `  COUNT(*) AS invalid_rows\n` +
    `FROM (\n` +
    `  SELECT\n` +
    `    CASE WHEN updated_at < created_at THEN 1 ELSE 0 END AS is_invalid\n` +
    `  FROM db_data_model.${tableName}\n` +
    `) t\n` +
    `WHERE is_invalid = 1\n` +
    `;\n`
  );
}

function dqaSourceCountByDay(sourceTable: string): string {
  return (
    `-- DQA type B (source query): count per day in source\n` +
    `SELECT\n` +
    `  CAST(updated_at AS DATE) AS day,\n` +
    `  COUNT(*) AS cnt\n` +
    `FROM ${sourceTable}\n` +
    `WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 7 DAY)\n` +
    `GROUP BY 1\n` +
    `ORDER BY 1\n` +
    `;\n`
  );
}

function dqaTargetCountByDay(modelTable: string): string {
  return (
    `-- DQA type B (target query): count per day in target\n` +
    `SELECT\n` +
    `  CAST(updated_at AS DATE) AS day,\n` +
    `  COUNT(*) AS cnt\n` +
    `FROM db_data_model.${modelTable}\n` +
    `WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 7 DAY)\n` +
    `GROUP BY 1\n` +
    `ORDER BY 1\n` +
    `;\n`
  );
}

const RAW_INITIAL_FILES: Record<string, SqlFile> = {
  // ── ecom_app / orders_daily (has DQA A + DQA B) ──
  [p("ecom_app", "orders_daily", "ddl", "create_table_stage.sql")]: f(
    ddlTable("db_stage", "orders", ORDER_COLS)
  ),
  [p("ecom_app", "orders_daily", "ddl", "create_table_data_model.sql")]: f(
    ddlTable("db_data_model", "orders", ORDER_COLS)
  ),
  [p("ecom_app", "orders_daily", "ddl", "bi_custom_ddl.sql")]: f(
    ddlBiCustom("orders")
  ),
  [p("ecom_app", "orders_daily", "extract", "extract_orders.sql")]: f(
    extractQuery("src.orders_raw")
  ),
  [p("ecom_app", "orders_daily", "transform", "transform_orders.sql")]: f(
    transformQuery("orders", "orders")
  ),
  [p("ecom_app", "orders_daily", "transform", "cleanup_stage.sql")]: f(
    cleanupQuery("orders")
  ),
  [p("ecom_app", "orders_daily", "load", "load_orders.sql")]: f(
    loadQuery("orders", "orders")
  ),
  [p("ecom_app", "orders_daily", "dqa", "orders_dates_sanity.sql")]: f(
    dqaRuleCheck("orders")
  ),
  [p("ecom_app", "orders_daily", "dqa", "source_orders_count_by_day.sql")]: f(
    dqaSourceCountByDay("src.orders_raw")
  ),
  [p("ecom_app", "orders_daily", "dqa", "target_orders_count_by_day.sql")]: f(
    dqaTargetCountByDay("orders")
  ),

  // ── ecom_app / customers_snapshot (only DQA A) ──
  [p("ecom_app", "customers_snapshot", "ddl", "create_table_stage.sql")]: f(
    ddlTable("db_stage", "customers", CUSTOMER_COLS)
  ),
  [p("ecom_app", "customers_snapshot", "ddl", "create_table_data_model.sql")]: f(
    ddlTable("db_data_model", "customers", CUSTOMER_COLS)
  ),
  [p("ecom_app", "customers_snapshot", "ddl", "bi_custom_ddl.sql")]: f(
    ddlBiCustom("customers")
  ),
  [p("ecom_app", "customers_snapshot", "extract", "extract_customers.sql")]: f(
    extractQuery("src.customers_raw")
  ),
  [p("ecom_app", "customers_snapshot", "transform", "transform_customers.sql")]: f(
    transformQuery("customers", "customers")
  ),
  [p("ecom_app", "customers_snapshot", "transform", "cleanup_stage.sql")]: f(
    cleanupQuery("customers")
  ),
  [p("ecom_app", "customers_snapshot", "load", "load_customers.sql")]: f(
    loadQuery("customers", "customers")
  ),
  [p("ecom_app", "customers_snapshot", "dqa", "customers_dates_sanity.sql")]: f(
    dqaRuleCheck("customers")
  ),

  // ── ecom_app / inventory_hourly (incremental; only DQA B) ──
  [p("ecom_app", "inventory_hourly", "ddl", "create_table_stage.sql")]: f(
    ddlTable("db_stage", "inventory_levels", INVENTORY_COLS)
  ),
  [p("ecom_app", "inventory_hourly", "ddl", "create_table_data_model.sql")]: f(
    ddlTable("db_data_model", "inventory_levels", INVENTORY_COLS)
  ),
  [p("ecom_app", "inventory_hourly", "ddl", "bi_custom_ddl.sql")]: f(
    ddlBiCustom("inventory_levels")
  ),
  [p("ecom_app", "inventory_hourly", "extract", "extract_inventory_levels.sql")]: f(
    extractQuery("src.inventory_levels_raw")
  ),
  [p("ecom_app", "inventory_hourly", "transform", "transform_inventory_levels.sql")]: f(
    transformQuery("inventory_levels", "inventory_levels")
  ),
  [p("ecom_app", "inventory_hourly", "transform", "cleanup_stage.sql")]: f(
    cleanupQuery("inventory_levels")
  ),
  [p("ecom_app", "inventory_hourly", "load", "load_inventory_levels.sql")]: f(
    loadQuery("inventory_levels", "inventory_levels")
  ),
  [p("ecom_app", "inventory_hourly", "dqa", "source_inventory_levels_count_by_day.sql")]: f(
    dqaSourceCountByDay("src.inventory_levels_raw")
  ),
  [p("ecom_app", "inventory_hourly", "dqa", "target_inventory_levels_count_by_day.sql")]: f(
    dqaTargetCountByDay("inventory_levels")
  ),

  // ── store_pos / store_sales_daily (snapshot; DQA A) ──
  [p("store_pos", "store_sales_daily", "ddl", "create_table_stage.sql")]: f(
    ddlTable("db_stage", "store_sales", STORE_SALES_COLS)
  ),
  [p("store_pos", "store_sales_daily", "ddl", "create_table_data_model.sql")]: f(
    ddlTable("db_data_model", "store_sales", STORE_SALES_COLS)
  ),
  [p("store_pos", "store_sales_daily", "ddl", "bi_custom_ddl.sql")]: f(
    ddlBiCustom("store_sales")
  ),
  [p("store_pos", "store_sales_daily", "extract", "extract_store_sales.sql")]: f(
    extractQuery("src.store_sales_raw")
  ),
  [p("store_pos", "store_sales_daily", "transform", "transform_store_sales.sql")]: f(
    transformQuery("store_sales", "store_sales")
  ),
  [p("store_pos", "store_sales_daily", "transform", "cleanup_stage.sql")]: f(
    cleanupQuery("store_sales")
  ),
  [p("store_pos", "store_sales_daily", "load", "load_store_sales.sql")]: f(
    loadQuery("store_sales", "store_sales")
  ),
  [p("store_pos", "store_sales_daily", "dqa", "store_sales_dates_sanity.sql")]: f(
    dqaRuleCheck("store_sales")
  ),

  // ── ad_platform / campaign_metrics_hourly (incremental; DQA A) ──
  [p("ad_platform", "campaign_metrics_hourly", "ddl", "create_table_stage.sql")]: f(
    ddlTable("db_stage", "campaign_metrics", CAMPAIGN_COLS)
  ),
  [p("ad_platform", "campaign_metrics_hourly", "ddl", "create_table_data_model.sql")]: f(
    ddlTable("db_data_model", "campaign_metrics", CAMPAIGN_COLS)
  ),
  [p("ad_platform", "campaign_metrics_hourly", "ddl", "bi_custom_ddl.sql")]: f(
    ddlBiCustom("campaign_metrics")
  ),
  [p("ad_platform", "campaign_metrics_hourly", "extract", "extract_campaign_metrics.sql")]: f(
    extractQuery("src.campaign_metrics_raw")
  ),
  [p("ad_platform", "campaign_metrics_hourly", "transform", "transform_campaign_metrics.sql")]: f(
    transformQuery("campaign_metrics", "campaign_metrics")
  ),
  [p("ad_platform", "campaign_metrics_hourly", "transform", "cleanup_stage.sql")]: f(
    cleanupQuery("campaign_metrics")
  ),
  [p("ad_platform", "campaign_metrics_hourly", "load", "load_campaign_metrics.sql")]: f(
    loadQuery("campaign_metrics", "campaign_metrics")
  ),
  [p("ad_platform", "campaign_metrics_hourly", "dqa", "campaign_metrics_dates_sanity.sql")]: f(
    dqaRuleCheck("campaign_metrics")
  ),

  // ── schema_and_user_creation ────────────────────────────────────
  "dags/schema_and_user_creation/load/schemas.sql": f(
    `CREATE DATABASE IF NOT EXISTS db_business_model_DEVELOP\n;\n` +
      `CREATE DATABASE IF NOT EXISTS db_data_model_DEVELOP\n;\n` +
      `CREATE DATABASE IF NOT EXISTS db_stage_DEVELOP\n;\n` +
      `CREATE DATABASE IF NOT EXISTS db_business_model\n;\n` +
      `CREATE DATABASE IF NOT EXISTS db_data_model\n;\n` +
      `CREATE DATABASE IF NOT EXISTS db_stage\n;`
  ),
};

export const initialFiles: Record<string, SqlFile> = anonymizeFiles(RAW_INITIAL_FILES);

const RAW_DAG_CONFIGS: DagConfig[] = [
  {
    dagName: "dag_ecom_app_orders_daily",
    integrationName: "ecom_app",
    schedule: "0 */3 * * *",
    tags: ["ecom_app", "orders", "snapshot"],
    dagType: "snapshot",
    owner: "owner_retail_1",
    startDate: "2024-01-15",
    timezone: "US/Eastern",
    team: "team_retail",
    incidentsChannel: "#incidents-retail",
    alertsChannel: "#alerts-retail",
  },
  {
    dagName: "dag_ecom_app_customers_snapshot",
    integrationName: "ecom_app",
    schedule: "5 */3 * * *",
    tags: ["ecom_app", "customers", "snapshot"],
    dagType: "snapshot",
    owner: "owner_retail_2",
    startDate: "2024-01-15",
    timezone: "US/Eastern",
    team: "team_retail",
    incidentsChannel: "#incidents-retail",
    alertsChannel: "#alerts-retail",
  },
  {
    dagName: "dag_ecom_app_inventory_hourly",
    integrationName: "ecom_app",
    schedule: "0 * * * *",
    tags: ["ecom_app", "inventory", "incremental"],
    dagType: "incremental",
    owner: "owner_retail_3",
    startDate: "2024-02-01",
    timezone: "US/Eastern",
    team: "team_retail",
    incidentsChannel: "#incidents-retail",
    alertsChannel: "#alerts-retail",
  },
  {
    dagName: "dag_store_pos_store_sales_daily",
    integrationName: "store_pos",
    schedule: "0 6 * * *",
    tags: ["store_pos", "sales", "snapshot"],
    dagType: "snapshot",
    owner: "owner_ops_1",
    startDate: "2024-03-10",
    timezone: "UTC",
    team: "team_ops",
    incidentsChannel: "#incidents-ops",
    alertsChannel: "#alerts-ops",
  },
  {
    dagName: "dag_ad_platform_campaign_metrics_hourly",
    integrationName: "ad_platform",
    schedule: "15 * * * *",
    tags: ["ad_platform", "campaigns", "incremental"],
    dagType: "incremental",
    owner: "owner_marketing_1",
    startDate: "2024-04-01",
    timezone: "Europe/Madrid",
    team: "team_marketing",
    incidentsChannel: "#incidents-marketing",
    alertsChannel: "#alerts-marketing",
  },
];

export const dagConfigs: DagConfig[] = deepAnonymize(RAW_DAG_CONFIGS);
