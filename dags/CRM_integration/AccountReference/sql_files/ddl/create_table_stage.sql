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