CREATE TABLE IF NOT EXISTS db_data_model.GamingIntegration_tr_GameTransaction (
    gameTransactionId BIGINT, 
    saga_hash BIGINT, 
    saga_real_run DATETIME, 
    transactionTypeId INT, 
    gameSessionId BIGINT, 
    providerRoundUid STRING, 
    providerTransactionUid STRING, 
    amount INT, 
    afterBalance INT, 
    jackpotContribution INT, 
    transactionDate DATETIME, 
    rowCreated DATETIME, 
    rowModified DATETIME, 
    roundStatusTypeId INT, 
    roundId BIGINT, 
    liveCasinoTableId BIGINT, 
    cancelTransactionId BIGINT, 
    relatedTransactionId BIGINT, 
    jackpotWin BOOLEAN, 
    jackpotWinAmount INT, 
    bonusBalance float, 
    lockedCashBalance float, 
    lockedCashWinningsBalance float, 
    riskBonusAmount float, 
    riskLockedCashAmount float, 
    riskLockedCashWinningsAmount float, 
    winBonusAmount float, 
    winLockedCashAmount float, 
    winLockedCashWinningsAmount float
) 
PRIMARY KEY (gameTransactionID) 
DISTRIBUTED BY HASH (gameTransactionID)
PROPERTIES(
    "replication_num" = "2", 
    "enable_persistent_index" = "true"
)
;