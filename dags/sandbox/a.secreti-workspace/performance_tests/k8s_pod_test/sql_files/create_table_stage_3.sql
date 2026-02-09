CREATE TABLE IF NOT EXISTS db_stage_DEVELOP.k8s_pod_test_3 (
    saga_hash BIGINT, 
    saga_real_run_ts DATETIME, 
    saga_logical_run_ts DATETIME, 
    reward_type_id STRING, 
    label STRING, 
    updated_at STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
);