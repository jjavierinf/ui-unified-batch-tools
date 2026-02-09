CREATE TABLE IF NOT EXISTS db_stage_DEVELOP.python_low_test (
    saga_hash BIGINT, 
    saga_real_run_ts DATETIME, 
    saga_logical_run_ts DATETIME, 
    create_date_time STRING, 
    update_date_time STRING, 
    form_submission_select_option_id STRING, 
    form_submission_field_id STRING, 
    select_option_id STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
)
;