CREATE TABLE IF NOT EXISTS db_data_model_DEVELOP.customer_details (
    customer_id BIGINT,
    customer_name STRING,
    birthdate DATE,
    created_at DATE
) ENGINE=OLAP
DUPLICATE KEY(`customer_id`, `customer_name`)
PARTITION BY RANGE(`created_at`)(START ("2023-09-01") END ("2030-01-01") EVERY (INTERVAL 1 MONTH))
DISTRIBUTED BY HASH(`created_at`) BUCKETS 32
PROPERTIES (
    "replication_num" = "3",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "MONTH",
    "dynamic_partition.start" = "-120",
    "dynamic_partition.end" = "12",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "16",
    "dynamic_partition.history_partition_num" = "0",
    "dynamic_partition.start_day_of_month" = "1",
    "in_memory" = "false",
    "storage_format" = "DEFAULT",
    "enable_persistent_index" = "false",
    "compression" = "LZ4"
)
;