CREATE TABLE IF NOT EXISTS db_data_model.Accounts_dbo_AccountReference (
    customerID STRING, 
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,
    lastLoginDateTime DATETIME, 
    lastPasswordResetDateTime DATETIME, 
    lastFailedLoginDateTime DATETIME, 
    lastResetPasswordRequestDateTime DATETIME, 
    lastClickResetPasswordEmailDateTime DATETIME
) 
PRIMARY KEY (customerID) 
DISTRIBUTED BY HASH (customerID)
PROPERTIES(
    "replication_num" = "2", 
    "enable_persistent_index" = "true"
);