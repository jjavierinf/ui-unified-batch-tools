CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_tr_GameTransaction (
    saga_hash BIGINT, 
    saga_real_run_ts DATETIME, 
    saga_logical_run_ts DATETIME, 
    gameTransactionID STRING, 
    transactionTypeID STRING, 
    gameSessionID STRING, 
    providerRoundUID STRING, 
    providerTransactionUID STRING, 
    amount STRING, 
    afterBalance STRING, 
    jackpotContribution STRING, 
    transactionDate STRING, 
    rowCreated STRING, 
    rowModified STRING, 
    roundStatusTypeID STRING, 
    roundID STRING, 
    liveCasinoTableID STRING, 
    cancelTransactionID STRING, 
    relatedTransactionID STRING, 
    jackpotWin STRING, 
    jackpotWinAmount STRING, 
    bonusBalance STRING, 
    lockedCashBalance STRING, 
    lockedCashWinningsBalance STRING, 
    riskBonusAmount STRING, 
    riskLockedCashAmount STRING, 
    riskLockedCashWinningsAmount STRING, 
    winBonusAmount STRING, 
    winLockedCashAmount STRING, 
    winLockedCashWinningsAmount STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
)
;