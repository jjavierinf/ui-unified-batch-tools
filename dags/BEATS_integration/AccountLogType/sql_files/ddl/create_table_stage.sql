CREATE TABLE IF NOT EXISTS db_stage.Accounts_dbo_AccountLogType (
	saga_hash BIGINT, 
	saga_real_run_ts DATETIME, 
	saga_logical_run_ts DATETIME, 
	accountLogTypeID STRING, 
	typeName STRING, 
	rowCreated STRING, 
	rowModified STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
)
;