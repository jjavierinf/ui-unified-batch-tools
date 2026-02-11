#!/usr/bin/env bash
# Sets up a test git repo for the Unified Batch Tools UI
# Creates branches: main (prod) and dev, populated with SQL files from mock data

set -euo pipefail

REPO_DIR="${1:-/tmp/test-pipeline-repo}"

echo "Setting up test repo at: $REPO_DIR"

if [ -d "$REPO_DIR" ]; then
  echo "Removing existing repo..."
  rm -rf "$REPO_DIR"
fi

mkdir -p "$REPO_DIR"
cd "$REPO_DIR"
git init
git checkout -b main

# ── CRM_integration / AccountReference ──
mkdir -p dags/CRM_integration/AccountReference/sql_files/{ddl,extract,transform,dqa}

cat > dags/CRM_integration/AccountReference/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.Accounts_dbo_AccountReference (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    customerID STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/CRM_integration/AccountReference/sql_files/ddl/create_table_data_model.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_data_model.Accounts_dbo_AccountReference (
    customerID STRING,
    saga_hash BIGINT,
    saga_real_run_ts DATETIME
)
PRIMARY KEY (customerID)
DISTRIBUTED BY HASH (customerID);
SQLEOF

cat > dags/CRM_integration/AccountReference/sql_files/extract/data_model_task.sql << 'SQLEOF'
SELECT *
FROM Accounts_dbo_AccountReference
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 HOUR)
;
SQLEOF

cat > dags/CRM_integration/AccountReference/sql_files/transform/data_model_task.sql << 'SQLEOF'
TRUNCATE TABLE db_data_model.Accounts_dbo_AccountReference
;

INSERT INTO db_data_model.Accounts_dbo_AccountReference
SELECT
    upper(trim(customerID)),
    saga_hash,
    saga_real_run_ts
FROM db_stage.Accounts_dbo_AccountReference
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et }}'
;
SQLEOF

cat > dags/CRM_integration/AccountReference/sql_files/dqa/delete_logs.sql << 'SQLEOF'
DELETE FROM db_stage.Accounts_dbo_AccountReference
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 3 MONTH)
;
SQLEOF

# ── CRM_integration / Game ──
mkdir -p dags/CRM_integration/Game/sql_files/{ddl,extract,transform,dqa}

cat > dags/CRM_integration/Game/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_gc_Game (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    gameID INT,
    gameName STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/CRM_integration/Game/sql_files/ddl/create_table_data_model.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_data_model.GamingIntegration_gc_Game (
    gameID INT,
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    name STRING
)
PRIMARY KEY (gameID)
DISTRIBUTED BY HASH (gameID);
SQLEOF

cat > dags/CRM_integration/Game/sql_files/extract/data_model_task.sql << 'SQLEOF'
SELECT *
FROM gc.Game
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 1 HOUR)
;
SQLEOF

cat > dags/CRM_integration/Game/sql_files/transform/data_model_task.sql << 'SQLEOF'
TRUNCATE TABLE db_data_model.GamingIntegration_gc_Game
;

INSERT INTO db_data_model.GamingIntegration_gc_Game
SELECT
    gameID,
    upper(trim(gameName)),
    saga_hash,
    saga_real_run_ts
FROM db_stage.GamingIntegration_gc_Game
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
;
SQLEOF

cat > dags/CRM_integration/Game/sql_files/dqa/delete_logs.sql << 'SQLEOF'
DELETE FROM db_stage.GamingIntegration_gc_Game
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 90 DAY)
;
SQLEOF

# ── CRM_integration / GameTransaction ──
mkdir -p dags/CRM_integration/GameTransaction/sql_files/{ddl,extract,transform,dqa}

cat > dags/CRM_integration/GameTransaction/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_tr_GameTransaction (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    transactionID BIGINT,
    amount DECIMAL(18,2)
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/CRM_integration/GameTransaction/sql_files/ddl/create_table_data_model.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_data_model.GamingIntegration_tr_GameTransaction (
    gameTransactionId BIGINT,
    saga_hash BIGINT,
    saga_real_run DATETIME,
    amount DECIMAL(18,2)
)
PRIMARY KEY (gameTransactionID)
DISTRIBUTED BY HASH (gameTransactionID);
SQLEOF

cat > dags/CRM_integration/GameTransaction/sql_files/extract/data_model_task.sql << 'SQLEOF'
SELECT *
FROM tr.GameTransaction
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 1 HOUR)
;
SQLEOF

cat > dags/CRM_integration/GameTransaction/sql_files/transform/data_model_task.sql << 'SQLEOF'
INSERT INTO db_data_model.GamingIntegration_tr_GameTransaction
SELECT
    stage.gameTransactionId,
    stage.saga_hash,
    stage.saga_real_run_ts,
    stage.amount
FROM db_stage.GamingIntegration_tr_GameTransaction AS stage
WHERE stage.saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
;
SQLEOF

cat > dags/CRM_integration/GameTransaction/sql_files/dqa/delete_logs.sql << 'SQLEOF'
SELECT COUNT(*) AS source_count
FROM db_stage.GamingIntegration_tr_GameTransaction
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
;
SQLEOF

# ── BEATS_integration / AccountLogType ──
mkdir -p dags/BEATS_integration/AccountLogType/sql_files/{ddl,extract,transform,dqa}

cat > dags/BEATS_integration/AccountLogType/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.Accounts_dbo_AccountLogType (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    accountLogTypeID STRING,
    typeName STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/BEATS_integration/AccountLogType/sql_files/ddl/create_table_data_model.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_data_model.Accounts_dbo_AccountLogType (
    accountLogTypeId SMALLINT,
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    typeName VARCHAR(50)
)
PRIMARY KEY (accountLogTypeId)
DISTRIBUTED BY HASH (accountLogTypeId);
SQLEOF

cat > dags/BEATS_integration/AccountLogType/sql_files/extract/data_model_task.sql << 'SQLEOF'
SELECT *
FROM dbo.AccountLogType
WHERE rowModified >= DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 1 HOUR)
;
SQLEOF

cat > dags/BEATS_integration/AccountLogType/sql_files/transform/data_model_task.sql << 'SQLEOF'
TRUNCATE TABLE db_data_model.Accounts_dbo_AccountLogType
;

INSERT INTO db_data_model.Accounts_dbo_AccountLogType
SELECT
    accountLogTypeID,
    saga_hash,
    saga_real_run_ts,
    typeName
FROM db_stage.Accounts_dbo_AccountLogType
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
;
SQLEOF

cat > dags/BEATS_integration/AccountLogType/sql_files/dqa/delete_logs.sql << 'SQLEOF'
DELETE FROM db_stage.Accounts_dbo_AccountLogType
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 90 DAY)
;
SQLEOF

# ── data_sources / gaming_integration / DailyTransactionAmount ──
mkdir -p dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/{ddl,extract,transform,dqa}

cat > dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/ddl/create_table_stage.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_stage.gamingintegration_tr_dailytransactionamount (
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    saga_logical_run_ts DATETIME,
    dailyTransactionAmountID STRING,
    customerID STRING,
    balance STRING,
    balanceDate STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash);
SQLEOF

cat > dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/ddl/create_table_data_model.sql << 'SQLEOF'
CREATE TABLE IF NOT EXISTS db_data_model.gamingintegration_tr_dailytransactionamount (
    dailyTransactionAmountId STRING,
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    customerID STRING,
    balance STRING,
    balanceDate DATE
)
PRIMARY KEY (dailyTransactionAmountId)
DISTRIBUTED BY HASH (dailyTransactionAmountId);
SQLEOF

cat > dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/extract/select_from_source.sql << 'SQLEOF'
SELECT *
FROM tr.DailyTransactionAmount
WHERE rowModified >= DATEADD(HOUR, -1, CAST('<saga_logical_run_ts>' AS DATETIME))
;
SQLEOF

cat > dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/transform/stage_to_data_model.sql << 'SQLEOF'
INSERT INTO db_data_model.gamingintegration_tr_dailytransactionamount
SELECT
    dailyTransactionAmountID,
    saga_hash,
    saga_real_run_ts,
    upper(trim(customerID)),
    balance,
    balanceDate
FROM db_stage.gamingintegration_tr_dailytransactionamount
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
;
SQLEOF

cat > dags/data_sources/gaming_integration/sqlserver_gamingintegration_tr_dailytransactionamount/sql_files/dqa/delete_stage_old_records.sql << 'SQLEOF'
DELETE FROM db_stage.gamingintegration_tr_dailytransactionamount
WHERE balanceDate < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 2 DAY)
;
SQLEOF

# ── schema_and_user_creation ──
mkdir -p dags/schema_and_user_creation/sql_files/load

cat > dags/schema_and_user_creation/sql_files/load/schemas.sql << 'SQLEOF'
CREATE DATABASE IF NOT EXISTS db_business_model_DEVELOP
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
;
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
find . -name "*.sql" | sort | head -40
echo "..."
