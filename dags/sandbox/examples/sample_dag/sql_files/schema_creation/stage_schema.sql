CREATE TABLE IF NOT EXISTS db_stage_DEVELOP.customer_details (
    customer_id STRING,
    customer_name STRING,
    birthdate STRING,
    created_at STRING
) ENGINE=OLAP
DISTRIBUTED BY HASH(customer_id) BUCKETS 32
;