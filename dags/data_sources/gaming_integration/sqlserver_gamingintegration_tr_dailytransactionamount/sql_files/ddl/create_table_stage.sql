CREATE TABLE IF NOT EXISTS db_stage.gamingintegration_tr_dailytransactionamount (
	`saga_hash` BIGINT, 
	`saga_real_run_ts` DATETIME, 
	`saga_logical_run_ts` DATETIME, 
	`dailyTransactionAmountID` STRING, 
	`customerID` STRING, 
	`balance` STRING, 
	`balanceDate` STRING, 
	`rowCreated` STRING, 
	`rowModified` STRING, 
	`gameTransactionID` STRING
)
PRIMARY KEY (`saga_hash`)
DISTRIBUTED BY HASH (`saga_hash`)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
);