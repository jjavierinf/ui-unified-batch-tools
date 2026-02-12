import { SqlFile, DagConfig } from "./types";
import { anonymizeFiles, deepAnonymize } from "./demo-mode";

function f(content: string): SqlFile {
  return { content, savedContent: content, status: "draft" };
}

const RAW_INITIAL_FILES: Record<string, SqlFile> = {
  // ── CRM_integration / AccountReference ──────────────────────────
  "dags/CRM_integration/AccountReference/ddl/create_table_stage.sql": f(
`CREATE TABLE IF NOT EXISTS db_stage.Accounts_dbo_AccountReference (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    customerID STRING,
    lastLoginDateTime STRING,
    lastPasswordResetDateTime STRING,
    lastFailedLoginDateTime STRING,
    lastResetPasswordRequestDateTime STRING,
    lastClickResetPasswordEmailDateTime STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
);`
  ),

  "dags/CRM_integration/AccountReference/ddl/create_table_data_model.sql": f(
`CREATE TABLE IF NOT EXISTS db_data_model.Accounts_dbo_AccountReference (
    customerID STRING,
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    lastLoginDateTime DATETIME,
    lastPasswordResetDateTime DATETIME,
    lastFailedLoginDateTime DATETIME,
    lastResetPasswordRequestDateTime DATETIME,
    lastClickResetPasswordEmailDateTime DATETIME
)
PRIMARY KEY (customerID)
DISTRIBUTED BY HASH (customerID)
PROPERTIES(
    "replication_num" = "2",
    "enable_persistent_index" = "true"
);`
  ),

  "dags/CRM_integration/AccountReference/ddl/bi_custom_ddl.sql": f(
`-- BI custom DDL (scaffold example)
ALTER TABLE db_data_model.Accounts_dbo_AccountReference
ADD COLUMN IF NOT EXISTS bi_note STRING
;`
  ),

  "dags/CRM_integration/AccountReference/extract/data_model_task.sql": f(
`SELECT *
FROM Accounts_dbo_AccountReference
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 HOUR)
;`
  ),

  "dags/CRM_integration/AccountReference/transform/data_model_task.sql": f(
`TRUNCATE TABLE db_data_model.Accounts_dbo_AccountReference
;

INSERT INTO
db_data_model.Accounts_dbo_AccountReference
SELECT
\tupper(trim(customerID)),
\tsaga_hash,
\tsaga_real_run_ts,
\tlastLoginDateTime,
\tlastPasswordResetDateTime,
\tlastFailedLoginDateTime,
\tlastResetPasswordRequestDateTime,
\tlastClickResetPasswordEmailDateTime
FROM db_stage.Accounts_dbo_AccountReference
WHERE
\tsaga_logical_run_ts = '{{ ts | convert_utc_to_et }}'
ORDER BY
\tsaga_real_run_ts ASC
;`
  ),

  "dags/CRM_integration/AccountReference/transform/cleanup_logs.sql": f(
`-- Cleanup logs (NOT DQA)
DELETE FROM db_stage.Accounts_dbo_AccountReference
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 3 MONTH)
;`
  ),

  "dags/CRM_integration/AccountReference/load/load_to_datamodel.sql": f(
`-- Load stage (example)
-- In a real DAG, this would upsert into the final datamodel table.
INSERT INTO db_data_model.Accounts_dbo_AccountReference
SELECT *
FROM db_stage.Accounts_dbo_AccountReference
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et }}'
;`
  ),

  "dags/CRM_integration/AccountReference/dqa/rule_check_accounts.sql": f(
`-- DQA type 2: rule check inside the same DB (single query)
-- Example: flag records where balanceDate is in the future.
SELECT
  COUNT(*) AS invalid_rows
FROM db_data_model.Accounts_dbo_AccountReference
WHERE balanceDate > '{{ ts | convert_utc_to_et }}'
;`
  ),

  "dags/CRM_integration/AccountReference/dqa/source_count_by_day.sql": f(
`-- DQA type 3 (source query): count per day in source
SELECT
  CAST(rowModified AS DATE) AS day,
  COUNT(*) AS cnt
FROM tr.AccountReference
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 7 DAY)
GROUP BY 1
ORDER BY 1;
`
  ),

  "dags/CRM_integration/AccountReference/dqa/target_count_by_day.sql": f(
`-- DQA type 3 (target query): count per day in target
SELECT
  CAST(saga_logical_run_ts AS DATE) AS day,
  COUNT(*) AS cnt
FROM db_data_model.Accounts_dbo_AccountReference
WHERE saga_logical_run_ts >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 7 DAY)
GROUP BY 1
ORDER BY 1;
`
  ),

  "dags/CRM_integration/AccountReference/dqa/compare_counts.sql": f(
`-- DQA type 3: source vs target query comparison (scaffold)
-- Config points to two query files:
--   - source_count_by_day.sql
--   - target_count_by_day.sql
-- This file exists to make the task obvious in the UI.
SELECT 1 AS scaffold_only;
`
  ),

  // ── CRM_integration / Game ──────────────────────────────────────
  "dags/CRM_integration/Game/ddl/create_table_stage.sql": f(
`CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_gc_Game (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    gameID STRING,
    gameTypeID STRING,
    gameSubTypeID STRING,
    name STRING,
    gamingGroupingKey STRING,
    hasJackpot STRING,
    freeRoundsSupported STRING,
    aspectRatio STRING,
    width STRING,
    height STRING,
    scaleUp STRING,
    scaleDown STRING,
    stretching STRING,
    html5 STRING,
    rowCreated STRING,
    rowModified STRING,
    isDeleted STRING,
    platformID STRING,
    title STRING,
    subtitle STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
);`
  ),

  "dags/CRM_integration/Game/ddl/create_table_data_model.sql": f(
`CREATE TABLE IF NOT EXISTS db_data_model.GamingIntegration_gc_Game (
    gameID INT,
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    gameTypeID INT,
    gameSubTypeID INT,
    name STRING,
    gamingGroupingKey INT,
    hasJackpot BOOLEAN,
    freeRoundsSupported BOOLEAN,
    aspectRatio STRING,
    width INT,
    height INT,
    scaleUp BOOLEAN,
    scaleDown BOOLEAN,
    stretching BOOLEAN,
    html5 BOOLEAN,
    rowCreated DATETIME,
    rowModified DATETIME,
    isDeleted INT,
    platformID INT,
    title STRING,
    subtitle STRING
)
PRIMARY KEY (gameID)
DISTRIBUTED BY HASH (gameID)
PROPERTIES(
    "replication_num" = "2",
    "enable_persistent_index" = "true"
);`
  ),

  "dags/CRM_integration/Game/ddl/bi_custom_ddl.sql": f(
`-- BI custom DDL (scaffold example)
ALTER TABLE db_data_model.GamingIntegration_gc_Game
ADD COLUMN IF NOT EXISTS bi_segment STRING
;`
  ),

  "dags/CRM_integration/Game/extract/data_model_task.sql": f(
`SELECT *
FROM gc.Game
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 1 HOUR)
;`
  ),

  "dags/CRM_integration/Game/transform/data_model_task.sql": f(
`TRUNCATE TABLE db_data_model.GamingIntegration_gc_Game
;

INSERT INTO
db_data_model.GamingIntegration_gc_Game
SELECT
\tstage.gameID,
\tstage.saga_hash,
\tstage.saga_real_run_ts,
\tstage.gameTypeID,
\tstage.gameSubTypeID,
\tstage.name,
\tstage.gamingGroupingKey,
\tstage.hasJackpot,
\tstage.freeRoundsSupported,
\tstage.aspectRatio,
\tCAST(CAST(stage.width AS FLOAT) AS INT),
\tCAST(CAST(stage.height AS FLOAT) AS INT),
\tstage.scaleUp,
\tstage.scaleDown,
\tstage.stretching,
\tstage.html5,
\tstage.rowCreated,
\tstage.rowModified,
\tstage.isDeleted,
\tstage.platformID,
\tstage.title,
\tstage.subtitle
FROM db_stage.GamingIntegration_gc_Game AS stage
WHERE
    stage.saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
ORDER BY
\tsaga_real_run_ts ASC
;`
  ),

  "dags/CRM_integration/Game/transform/cleanup_logs.sql": f(
`-- Cleanup logs (NOT DQA)
DELETE FROM db_stage.GamingIntegration_gc_Game
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 90 DAY)
;`
  ),

  "dags/CRM_integration/Game/dqa/rule_check_game.sql": f(
`-- DQA type 2: rule check (single query)
-- Example: make sure name is not empty.
SELECT
  COUNT(*) AS invalid_rows
FROM db_data_model.GamingIntegration_gc_Game
WHERE name IS NULL OR TRIM(name) = ''
;`
  ),

  // ── CRM_integration / GameTransaction ───────────────────────────
  "dags/CRM_integration/GameTransaction/ddl/create_table_stage.sql": f(
`CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_tr_GameTransaction (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    gameTransactionID STRING,
    transactionTypeID STRING,
    gameSessionID STRING,
    providerRoundUID STRING,
    providerTransactionUID STRING,
    amount STRING,
    afterBalance STRING,
    jackpotContribution STRING,
    transactionDate STRING,
    rowCreated STRING,
    rowModified STRING,
    roundStatusTypeID STRING,
    roundID STRING,
    liveCasinoTableID STRING,
    cancelTransactionID STRING,
    relatedTransactionID STRING,
    jackpotWin STRING,
    jackpotWinAmount STRING,
    bonusBalance STRING,
    lockedCashBalance STRING,
    lockedCashWinningsBalance STRING,
    riskBonusAmount STRING,
    riskLockedCashAmount STRING,
    riskLockedCashWinningsAmount STRING,
    winBonusAmount STRING,
    winLockedCashAmount STRING,
    winLockedCashWinningsAmount STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
)
;`
  ),

  "dags/CRM_integration/GameTransaction/ddl/create_table_data_model.sql": f(
`CREATE TABLE IF NOT EXISTS db_data_model.GamingIntegration_tr_GameTransaction (
    gameTransactionId BIGINT,
    saga_hash BIGINT,
    saga_real_run DATETIME,
    transactionTypeId INT,
    gameSessionId BIGINT,
    providerRoundUid STRING,
    providerTransactionUid STRING,
    amount INT,
    afterBalance INT,
    jackpotContribution INT,
    transactionDate DATETIME,
    rowCreated DATETIME,
    rowModified DATETIME,
    roundStatusTypeId INT,
    roundId BIGINT,
    liveCasinoTableId BIGINT,
    cancelTransactionId BIGINT,
    relatedTransactionId BIGINT,
    jackpotWin BOOLEAN,
    jackpotWinAmount INT,
    bonusBalance float,
    lockedCashBalance float,
    lockedCashWinningsBalance float,
    riskBonusAmount float,
    riskLockedCashAmount float,
    riskLockedCashWinningsAmount float,
    winBonusAmount float,
    winLockedCashAmount float,
    winLockedCashWinningsAmount float
)
PRIMARY KEY (gameTransactionID)
DISTRIBUTED BY HASH (gameTransactionID)
PROPERTIES(
    "replication_num" = "2",
    "enable_persistent_index" = "true"
)
;`
  ),

  "dags/CRM_integration/GameTransaction/ddl/bi_custom_ddl.sql": f(
`-- BI custom DDL (scaffold example)
ALTER TABLE db_data_model.GamingIntegration_tr_GameTransaction
ADD COLUMN IF NOT EXISTS bi_flag STRING
;`
  ),

  "dags/CRM_integration/GameTransaction/extract/data_model_task.sql": f(
`SELECT *
FROM tr.GameTransaction
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 1 HOUR)
;`
  ),

  "dags/CRM_integration/GameTransaction/transform/data_model_task.sql": f(
`INSERT INTO db_data_model.GamingIntegration_tr_GameTransaction
SELECT
\tstage.gameTransactionId,
    stage.saga_hash,
\tstage.saga_real_run_ts,
\tstage.transactionTypeId,
\tstage.gameSessionId,
\tstage.providerRoundUid,
\tstage.providerTransactionUid,
\tstage.amount,
\tstage.afterBalance,
\tCAST(CAST(stage.jackpotContribution AS FLOAT) AS INT),
\tstage.transactionDate,
\tstage.rowCreated,
\tstage.rowModified,
\tCAST(CAST(stage.roundStatusTypeId AS FLOAT) AS INT),
\tstage.roundId,
\tstage.liveCasinoTableId,
\tstage.cancelTransactionId,
\tstage.relatedTransactionId,
\tstage.jackpotWin,
\tstage.jackpotWinAmount,
\tstage.bonusBalance,
\tstage.lockedCashBalance,
\tstage.lockedCashWinningsBalance,
\tstage.riskBonusAmount,
\tstage.riskLockedCashAmount,
\tstage.riskLockedCashWinningsAmount,
\tstage.winBonusAmount,
\tstage.winLockedCashAmount,
\tstage.winLockedCashWinningsAmount
FROM db_stage.GamingIntegration_tr_GameTransaction AS stage
WHERE
    stage.saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
ORDER BY
\tsaga_real_run_ts ASC
;`
  ),

  "dags/CRM_integration/GameTransaction/transform/cleanup_logs.sql": f(
`-- Cleanup logs (NOT DQA)
DELETE FROM db_stage.GamingIntegration_tr_GameTransaction
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 14 DAY)
;`
  ),

  "dags/CRM_integration/GameTransaction/dqa/source_count_by_day.sql": f(
`-- DQA type 3 (source query): count per day in source
SELECT
  CAST(rowModified AS DATE) AS day,
  COUNT(*) AS cnt
FROM tr.GameTransaction
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 7 DAY)
GROUP BY 1
ORDER BY 1;
`
  ),

  "dags/CRM_integration/GameTransaction/dqa/target_count_by_day.sql": f(
`-- DQA type 3 (target query): count per day in target
SELECT
  CAST(saga_logical_run_ts AS DATE) AS day,
  COUNT(*) AS cnt
FROM db_stage.GamingIntegration_tr_GameTransaction
WHERE saga_logical_run_ts >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 7 DAY)
GROUP BY 1
ORDER BY 1;
`
  ),

  "dags/CRM_integration/GameTransaction/dqa/compare_counts.sql": f(
`-- DQA type 3: source vs target query comparison (scaffold)
-- Config points to:
--   - source_count_by_day.sql
--   - target_count_by_day.sql
SELECT 1 AS scaffold_only;
`
  ),

  // ── BEATS_integration / AccountLogType ──────────────────────────
  "dags/BEATS_integration/AccountLogType/ddl/create_table_stage.sql": f(
`CREATE TABLE IF NOT EXISTS db_stage.Accounts_dbo_AccountLogType (
\tsaga_hash BIGINT,
\tsaga_real_run_ts DATETIME,
\tsaga_logical_run_ts DATETIME,
\taccountLogTypeID STRING,
\ttypeName STRING,
\trowCreated STRING,
\trowModified STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
)
;`
  ),

  "dags/BEATS_integration/AccountLogType/ddl/create_table_data_model.sql": f(
`CREATE TABLE IF NOT EXISTS db_data_model.Accounts_dbo_AccountLogType (
\taccountLogTypeId SMALLINT,
\tsaga_hash BIGINT,
\tsaga_real_run_ts DATETIME,
\ttypeName VARCHAR(50),
\trowCreated DATETIME,
\trowModified DATETIME
)
PRIMARY KEY (accountLogTypeId)
DISTRIBUTED BY HASH (accountLogTypeId)
PROPERTIES(
    "replication_num" = "2",
    "enable_persistent_index" = "true"
)
;`
  ),

  "dags/BEATS_integration/AccountLogType/ddl/bi_custom_ddl.sql": f(
`-- BI custom DDL (scaffold example)
ALTER TABLE db_data_model.Accounts_dbo_AccountLogType
ADD COLUMN IF NOT EXISTS bi_description STRING
;`
  ),

  "dags/BEATS_integration/AccountLogType/extract/data_model_task.sql": f(
`SELECT *
FROM dbo.AccountLogType
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 1 HOUR)
;`
  ),

  "dags/BEATS_integration/AccountLogType/transform/data_model_task.sql": f(
`TRUNCATE TABLE db_data_model.Accounts_dbo_AccountLogType
;

INSERT INTO db_data_model.Accounts_dbo_AccountLogType
SELECT
    accountLogTypeID,
\tsaga_hash,
\tsaga_real_run_ts,
\ttypeName,
\trowCreated,
\trowModified
FROM db_stage.Accounts_dbo_AccountLogType
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
ORDER BY saga_real_run_ts ASC
;`
  ),

  "dags/BEATS_integration/AccountLogType/transform/cleanup_logs.sql": f(
`-- Cleanup logs (NOT DQA)
DELETE FROM db_stage.Accounts_dbo_AccountLogType
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 90 DAY)
;`
  ),

  "dags/BEATS_integration/AccountLogType/dqa/rule_check_acctlog.sql": f(
`-- DQA type 2: rule check (single query)
-- Example: typeName should be present.
SELECT
  COUNT(*) AS invalid_rows
FROM db_data_model.Accounts_dbo_AccountLogType
WHERE typeName IS NULL OR TRIM(typeName) = ''
;`
  ),

  // ── data_sources / gaming_integration / DailyTransactionAmount ──
  "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/ddl/create_table_stage.sql": f(
`CREATE TABLE IF NOT EXISTS db_stage.gamingintegration_tr_dailytransactionamount (
\t\`saga_hash\` BIGINT,
\t\`saga_real_run_ts\` DATETIME,
\t\`saga_logical_run_ts\` DATETIME,
\t\`dailyTransactionAmountID\` STRING,
\t\`customerID\` STRING,
\t\`balance\` STRING,
\t\`balanceDate\` STRING,
\t\`rowCreated\` STRING,
\t\`rowModified\` STRING,
\t\`gameTransactionID\` STRING
)
PRIMARY KEY (\`saga_hash\`)
DISTRIBUTED BY HASH (\`saga_hash\`)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
);`
  ),

  "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/ddl/create_table_data_model.sql": f(
`CREATE TABLE IF NOT EXISTS db_data_model.gamingintegration_tr_dailytransactionamount (
\t\`dailyTransactionAmountId\` BIGINT,
\t\`saga_hash\` BIGINT,
\t\`saga_real_run_ts\` DATETIME,
\t\`customerId\` VARCHAR(100),
\t\`balance\` FLOAT,
\t\`balanceDate\` DATETIME,
\t\`rowCreated\` DATETIME,
\t\`rowModified\` DATETIME,
\t\`gameTransactionId\` BIGINT
)
PRIMARY KEY (\`dailyTransactionAmountId\`)
DISTRIBUTED BY HASH (\`dailyTransactionAmountId\`)
PROPERTIES(
    "replication_num" = "2",
    "enable_persistent_index" = "true"
);`
  ),

  "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/ddl/bi_custom_ddl.sql": f(
`-- BI custom DDL (scaffold example)
ALTER TABLE db_data_model.gamingintegration_tr_dailytransactionamount
ADD COLUMN IF NOT EXISTS bi_bucket STRING
;`
  ),

  "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/transform/stage_to_data_model.sql": f(
`INSERT INTO db_data_model.gamingintegration_tr_dailytransactionamount
WITH data_rownum AS (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY \`dailyTransactionAmountID\`\t\t\t\t\t\t\t\t
                               ORDER BY saga_real_run_ts DESC)
                                     AS rn
    FROM db_stage.gamingintegration_tr_dailytransactionamount
    WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
)
SELECT
    \`dailyTransactionAmountID\`,
\t\`saga_hash\`,
\t\`saga_real_run_ts\`,
\tupper(trim(\`customerID\`)),
\t\`balance\`,
\t\`balanceDate\`,
\t\`rowCreated\`,
\t\`rowModified\`,
\t\`gameTransactionID\`
FROM data_rownum
WHERE rn = 1;`
  ),

  "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/extract/select_from_source.sql": f(
`SELECT *
FROM tr.DailyTransactionAmount
WHERE (rowCreated <= DATEADD(HOUR, 1, CAST('<saga_logical_run_ts>' AS DATETIME))
  AND rowCreated > DATEADD(HOUR, -1, CAST('<saga_logical_run_ts>' AS DATETIME))) OR
  (rowModified <= DATEADD(HOUR, 1, CAST('<saga_logical_run_ts>' AS DATETIME))
  AND rowModified > DATEADD(HOUR, -1, CAST('<saga_logical_run_ts>' AS DATETIME)));`
  ),

  "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/transform/cleanup_stage_old_records.sql": f(
`-- Cleanup stage old records (NOT DQA)
DELETE FROM db_stage.gamingintegration_tr_dailytransactionamount
WHERE balanceDate < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 2 DAY)
;`
  ),

  "dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/dqa/rule_check_dailytx.sql": f(
`-- DQA type 2: rule check (single query)
-- Example: balance should not be negative.
SELECT
  COUNT(*) AS invalid_rows
FROM db_data_model.gamingintegration_tr_dailytransactionamount
WHERE balance < 0
;`
  ),

  // ── schema_and_user_creation ────────────────────────────────────
  "dags/schema_and_user_creation/load/schemas.sql": f(
`CREATE DATABASE IF NOT EXISTS db_business_model_DEVELOP
;
CREATE DATABASE IF NOT EXISTS db_data_model_DEVELOP
;
CREATE DATABASE IF NOT EXISTS db_stage_DEVELOP
;
CREATE DATABASE IF NOT EXISTS db_business_model
;
CREATE DATABASE IF NOT EXISTS db_data_model
;
CREATE DATABASE IF NOT EXISTS db_stage
;`
  ),
};

export const initialFiles: Record<string, SqlFile> = anonymizeFiles(RAW_INITIAL_FILES);

const RAW_DAG_CONFIGS: DagConfig[] = [
  {
    dagName: "dag_CRM_integration_dbo_AccountReference",
    integrationName: "CRM_integration",
    schedule: "7 0,3,6,9,12,15,18,21 * * *",
    tags: ["CRM_integration", "snapshot"],
    dagType: "snapshot",
    owner: "javier",
    startDate: "2024-01-15",
    timezone: "US/Eastern",
    team: "data-engineering",
    incidentsChannel: "#incidents-data",
    alertsChannel: "#alerts-data",
  },
  {
    dagName: "dag_CRM_integration_gc_Game",
    integrationName: "CRM_integration",
    schedule: "5 0,3,6,9,12,15,18,21 * * *",
    tags: ["CRM_integration", "snapshot"],
    dagType: "snapshot",
    owner: "javier",
    startDate: "2024-01-15",
    timezone: "US/Eastern",
    team: "data-engineering",
    incidentsChannel: "#incidents-data",
    alertsChannel: "#alerts-data",
  },
  {
    dagName: "dag_CRM_integration_tr_GameTransaction",
    integrationName: "CRM_integration",
    schedule: "0 * * * *",
    tags: ["CRM_integration", "incremental"],
    dagType: "incremental",
    owner: "maria",
    startDate: "2024-02-01",
    timezone: "US/Eastern",
    team: "data-engineering",
    incidentsChannel: "#incidents-crm",
    alertsChannel: "#alerts-crm",
  },
  {
    dagName: "dag_BEATS_integration_dbo_AccountLogType",
    integrationName: "BEATS_integration",
    schedule: "0 6 * * *",
    tags: ["BEATS_integration", "snapshot"],
    dagType: "snapshot",
    owner: "carlos",
    startDate: "2024-03-10",
    timezone: "UTC",
    team: "platform",
    incidentsChannel: "#incidents-beats",
    alertsChannel: "#alerts-beats",
  },
  {
    dagName: "dag_data_sources_tr_DailyTransactionAmount",
    integrationName: "data_sources",
    schedule: "0 * * * *",
    tags: ["data_sources", "incremental"],
    dagType: "incremental",
    owner: "lucia",
    startDate: "2024-04-01",
    timezone: "Europe/Madrid",
    team: "analytics",
    incidentsChannel: "#incidents-datasources",
    alertsChannel: "#alerts-datasources",
  },
];

export const dagConfigs: DagConfig[] = deepAnonymize(RAW_DAG_CONFIGS);
