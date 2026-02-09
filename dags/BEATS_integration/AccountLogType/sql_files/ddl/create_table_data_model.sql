CREATE TABLE IF NOT EXISTS db_data_model.Accounts_dbo_AccountLogType (
	accountLogTypeId SMALLINT, 
	saga_hash BIGINT, 
	saga_real_run_ts DATETIME, 
	typeName VARCHAR(50), 
	rowCreated DATETIME, 
	rowModified DATETIME
) 
PRIMARY KEY (accountLogTypeId)
DISTRIBUTED BY HASH (accountLogTypeId)
PROPERTIES(
    "replication_num" = "2", 
    "enable_persistent_index" = "true"
)
;