CREATE TABLE IF NOT EXISTS db_data_model.gamingintegration_tr_dailytransactionamount (
	`dailyTransactionAmountId` BIGINT, 
	`saga_hash` BIGINT, 
	`saga_real_run_ts` DATETIME, 
	`customerId` VARCHAR(100), 
	`balance` FLOAT, 
	`balanceDate` DATETIME, 
	`rowCreated` DATETIME, 
	`rowModified` DATETIME, 
	`gameTransactionId` BIGINT
) 
PRIMARY KEY (`dailyTransactionAmountId`)
DISTRIBUTED BY HASH (`dailyTransactionAmountId`)
PROPERTIES(
    "replication_num" = "2", 
    "enable_persistent_index" = "true"
);