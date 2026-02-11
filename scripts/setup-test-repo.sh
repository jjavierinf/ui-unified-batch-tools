#!/usr/bin/env bash
# Sets up a test git repo for the Unified Batch Tools UI
# Creates branches: main (prod) and dev, populated with SQL files from mock data

set -euo pipefail

REPO_DIR="${1:-/tmp/test-pipeline-repo}"

echo "Setting up test repo at: $REPO_DIR"

# Clean up if exists
if [ -d "$REPO_DIR" ]; then
  echo "Removing existing repo..."
  rm -rf "$REPO_DIR"
fi

mkdir -p "$REPO_DIR"
cd "$REPO_DIR"
git init
git checkout -b main

# ── CRM_integration / AccountReference ──
mkdir -p dags/CRM_integration/AccountReference/sql_files/ddl
mkdir -p dags/CRM_integration/AccountReference/sql_files/transformations

cat > dags/CRM_integration/AccountReference/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.Accounts_dbo_AccountReference (
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
);
SQLEOF

cat > dags/CRM_integration/AccountReference/sql_files/ddl/create_table_data_model.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_data_model.Accounts_dbo_AccountReference (
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
);
SQLEOF

cat > dags/CRM_integration/AccountReference/sql_files/transformations/data_model_task.sql << 'SQLEOF'
TRUNCATE TABLE db_data_model.Accounts_dbo_AccountReference
;

INSERT INTO
db_data_model.Accounts_dbo_AccountReference
SELECT
    upper(trim(customerID)),
    saga_hash,
    saga_real_run_ts,
    lastLoginDateTime,
    lastPasswordResetDateTime,
    lastFailedLoginDateTime,
    lastResetPasswordRequestDateTime,
    lastClickResetPasswordEmailDateTime
FROM db_stage.Accounts_dbo_AccountReference
WHERE
    saga_logical_run_ts = '{{ ts | convert_utc_to_et }}'
ORDER BY
    saga_real_run_ts ASC
;
SQLEOF

cat > dags/CRM_integration/AccountReference/sql_files/transformations/delete_logs_task.sql << 'SQLEOF'
DELETE FROM db_data_model.Accounts_dbo_AccountReference_log
WHERE saga_real_run_ts < DATE_SUB(NOW(), INTERVAL 90 DAY)
;
SQLEOF

# ── CRM_integration / Game ──
mkdir -p dags/CRM_integration/Game/sql_files/ddl
mkdir -p dags/CRM_integration/Game/sql_files/transformations

cat > dags/CRM_integration/Game/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_gc_Game (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    gameID INT,
    gameName STRING,
    gameType STRING,
    releaseDate DATE,
    isActive BOOLEAN
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/CRM_integration/Game/sql_files/transformations/data_model_task.sql << 'SQLEOF'
TRUNCATE TABLE db_data_model.GamingIntegration_gc_Game
;

INSERT INTO db_data_model.GamingIntegration_gc_Game
SELECT
    gameID,
    upper(trim(gameName)),
    gameType,
    releaseDate,
    isActive,
    saga_hash,
    saga_real_run_ts
FROM db_stage.GamingIntegration_gc_Game
WHERE saga_logical_run_ts = '{{ ts }}'
;
SQLEOF

cat > dags/CRM_integration/Game/sql_files/transformations/cleanup_old_games.sql << 'SQLEOF'
DELETE FROM db_data_model.GamingIntegration_gc_Game
WHERE isActive = false
AND saga_real_run_ts < DATE_SUB(NOW(), INTERVAL 365 DAY)
;
SQLEOF

# ── CRM_integration / GameTransaction ──
mkdir -p dags/CRM_integration/GameTransaction/sql_files/ddl
mkdir -p dags/CRM_integration/GameTransaction/sql_files/transformations

cat > dags/CRM_integration/GameTransaction/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_tr_GameTransaction (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    transactionID BIGINT,
    gameID INT,
    customerID STRING,
    amount DECIMAL(18,2),
    transactionDate DATETIME,
    transactionType STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/CRM_integration/GameTransaction/sql_files/transformations/data_model_task.sql << 'SQLEOF'
INSERT INTO db_data_model.GamingIntegration_tr_GameTransaction
SELECT
    transactionID,
    gameID,
    upper(trim(customerID)),
    amount,
    transactionDate,
    transactionType,
    saga_hash,
    saga_real_run_ts
FROM db_stage.GamingIntegration_tr_GameTransaction
WHERE saga_logical_run_ts = '{{ ts }}'
;
SQLEOF

cat > dags/CRM_integration/GameTransaction/sql_files/transformations/cleanup_old_transactions.sql << 'SQLEOF'
DELETE FROM db_data_model.GamingIntegration_tr_GameTransaction_archive
WHERE transactionDate < DATE_SUB(NOW(), INTERVAL 730 DAY)
;
SQLEOF

# ── BEATS_integration / AccountLogType ──
mkdir -p dags/BEATS_integration/AccountLogType/sql_files/ddl
mkdir -p dags/BEATS_integration/AccountLogType/sql_files/transformations

cat > dags/BEATS_integration/AccountLogType/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.Accounts_dbo_AccountLogType (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    logTypeID INT,
    logTypeName STRING,
    description STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/BEATS_integration/AccountLogType/sql_files/transformations/data_model_task.sql << 'SQLEOF'
TRUNCATE TABLE db_data_model.Accounts_dbo_AccountLogType
;

INSERT INTO db_data_model.Accounts_dbo_AccountLogType
SELECT
    logTypeID,
    upper(trim(logTypeName)),
    description,
    saga_hash,
    saga_real_run_ts
FROM db_stage.Accounts_dbo_AccountLogType
WHERE saga_logical_run_ts = '{{ ts }}'
;
SQLEOF

cat > dags/BEATS_integration/AccountLogType/sql_files/transformations/cleanup_old_logs.sql << 'SQLEOF'
DELETE FROM db_data_model.Accounts_dbo_AccountLogType_history
WHERE saga_real_run_ts < DATE_SUB(NOW(), INTERVAL 180 DAY)
;
SQLEOF

# ── data_sources / DailyTransactionAmount ──
mkdir -p dags/data_sources/DailyTransactionAmount/sql_files/ddl
mkdir -p dags/data_sources/DailyTransactionAmount/sql_files/transformations

cat > dags/data_sources/DailyTransactionAmount/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.data_sources_tr_DailyTransactionAmount (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    transactionDate DATE,
    totalAmount DECIMAL(18,2),
    transactionCount INT,
    avgAmount DECIMAL(18,2)
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/data_sources/DailyTransactionAmount/sql_files/transformations/data_model_task.sql << 'SQLEOF'
INSERT INTO db_data_model.data_sources_tr_DailyTransactionAmount
SELECT
    transactionDate,
    SUM(amount) AS totalAmount,
    COUNT(*) AS transactionCount,
    AVG(amount) AS avgAmount,
    saga_hash,
    saga_real_run_ts
FROM db_stage.data_sources_tr_DailyTransactionAmount
WHERE saga_logical_run_ts = '{{ ts }}'
GROUP BY transactionDate, saga_hash, saga_real_run_ts
;
SQLEOF

cat > dags/data_sources/DailyTransactionAmount/sql_files/transformations/cleanup_old_data.sql << 'SQLEOF'
DELETE FROM db_data_model.data_sources_tr_DailyTransactionAmount_archive
WHERE transactionDate < DATE_SUB(NOW(), INTERVAL 365 DAY)
;
SQLEOF

# ── schema_and_user_creation ──
mkdir -p dags/schema_and_user_creation/sql_files/transformations

cat > dags/schema_and_user_creation/sql_files/transformations/create_schemas.sql << 'SQLEOF'
-- Create schemas for staging and data model layers
CREATE DATABASE IF NOT EXISTS db_stage;
CREATE DATABASE IF NOT EXISTS db_data_model;

-- Grant permissions
GRANT ALL ON DATABASE db_stage TO ROLE data_engineering;
GRANT ALL ON DATABASE db_data_model TO ROLE data_engineering;
GRANT SELECT ON DATABASE db_data_model TO ROLE bi_users;
SQLEOF

# ── Initial commit on main ──
git add -A
git commit -m "Initial pipeline SQL files"

# ── Create dev branch ──
git checkout -b dev
git commit --allow-empty -m "Initialize dev branch"

echo ""
echo "Test repo ready at: $REPO_DIR"
echo "Branches: main, dev"
echo "Files:"
find . -name "*.sql" | sort | head -20
echo "..."
