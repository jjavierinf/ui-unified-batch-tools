#!/usr/bin/env bash
# Sets up a test git repo for the Unified Batch Tools UI
# Creates branches: main (prod) and dev, populated with generic SQL files

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

write_pipeline() {
  local integration="$1"
  local pipe="$2"
  local table="$3"

  mkdir -p "dags/${integration}/${pipe}/ddl" "dags/${integration}/${pipe}/extract" "dags/${integration}/${pipe}/transform" "dags/${integration}/${pipe}/load" "dags/${integration}/${pipe}/dqa"

  cat > "dags/${integration}/${pipe}/ddl/create_table_stage.sql" << SQLEOF
CREATE TABLE IF NOT EXISTS db_stage.${table} (
  id BIGINT,
  created_at DATETIME,
  updated_at DATETIME,
  col_a STRING,
  col_b STRING
)
PRIMARY KEY (id)
DISTRIBUTED BY HASH (id);
SQLEOF

  cat > "dags/${integration}/${pipe}/ddl/create_table_data_model.sql" << SQLEOF
CREATE TABLE IF NOT EXISTS db_data_model.${table} (
  id BIGINT,
  created_at DATETIME,
  updated_at DATETIME,
  col_a STRING,
  col_b STRING
)
PRIMARY KEY (id)
DISTRIBUTED BY HASH (id);
SQLEOF

  cat > "dags/${integration}/${pipe}/ddl/bi_custom_ddl.sql" << SQLEOF
-- BI custom DDL (scaffold example)
ALTER TABLE db_data_model.${table}
ADD COLUMN IF NOT EXISTS demo_note STRING
;
SQLEOF

  cat > "dags/${integration}/${pipe}/extract/extract_${table}.sql" << SQLEOF
SELECT *
FROM src.${table}_raw
WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 HOUR)
;
SQLEOF

  cat > "dags/${integration}/${pipe}/transform/transform_${table}.sql" << SQLEOF
INSERT INTO db_data_model.${table}
SELECT *
FROM db_stage.${table}
WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 DAY)
;
SQLEOF

  cat > "dags/${integration}/${pipe}/transform/cleanup_stage.sql" << SQLEOF
-- Cleanup logs (NOT DQA)
DELETE FROM db_stage.${table}
WHERE updated_at < DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 30 DAY)
;
SQLEOF

  cat > "dags/${integration}/${pipe}/load/load_${table}.sql" << SQLEOF
INSERT INTO db_data_model.${table}
SELECT *
FROM db_stage.${table}
WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 1 DAY)
;
SQLEOF

  cat > "dags/${integration}/${pipe}/dqa/${table}_dates_sanity.sql" << SQLEOF
-- DQA type A: single query rule check (same DB)
-- Alert if there are rows where updated_at is before created_at.
SELECT
  COUNT(*) AS invalid_rows
FROM (
  SELECT
    CASE WHEN updated_at < created_at THEN 1 ELSE 0 END AS is_invalid
  FROM db_data_model.${table}
) t
WHERE is_invalid = 1
;
SQLEOF

  cat > "dags/${integration}/${pipe}/dqa/source_${table}_count_by_day.sql" << SQLEOF
-- DQA type B (source query): count per day in source
SELECT
  CAST(updated_at AS DATE) AS day,
  COUNT(*) AS cnt
FROM src.${table}_raw
WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 7 DAY)
GROUP BY 1
ORDER BY 1
;
SQLEOF

  cat > "dags/${integration}/${pipe}/dqa/target_${table}_count_by_day.sql" << SQLEOF
-- DQA type B (target query): count per day in target
SELECT
  CAST(updated_at AS DATE) AS day,
  COUNT(*) AS cnt
FROM db_data_model.${table}
WHERE updated_at >= DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 7 DAY)
GROUP BY 1
ORDER BY 1
;
SQLEOF
}

# Pipelines (retail/ecommerce flavored, but generic)
write_pipeline "ecom_app" "orders_daily" "orders"
write_pipeline "ecom_app" "customers_snapshot" "customers"
write_pipeline "ecom_app" "inventory_hourly" "inventory_levels"
write_pipeline "store_pos" "store_sales_daily" "store_sales"
write_pipeline "ad_platform" "campaign_metrics_hourly" "campaign_metrics"

# ── schema_and_user_creation ──
mkdir -p dags/schema_and_user_creation/load

cat > dags/schema_and_user_creation/load/schemas.sql << 'SQLEOF'
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
git commit -m "Initial pipeline SQL files (generic)"

# ── Create dev branch ──
git checkout -b dev
git commit --allow-empty -m "Initialize dev branch"

echo ""
echo "Test repo ready at: $REPO_DIR"
echo "Branches: main, dev"
echo "Files:"
find . -name "*.sql" | sort | head -40
echo "..."
