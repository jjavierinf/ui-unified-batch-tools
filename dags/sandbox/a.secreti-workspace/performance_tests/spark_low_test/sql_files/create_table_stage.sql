CREATE TABLE IF NOT EXISTS db_stage_DEVELOP.spark_low_test (
    form_submission_select_option_id STRING, 
    create_date_time STRING, 
    update_date_time STRING, 
    form_submission_field_id STRING, 
    select_option_id STRING
)
PRIMARY KEY (form_submission_select_option_id)
DISTRIBUTED BY HASH (form_submission_select_option_id)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
)
;