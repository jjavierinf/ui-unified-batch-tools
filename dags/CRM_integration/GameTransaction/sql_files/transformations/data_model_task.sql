INSERT INTO db_data_model.GamingIntegration_tr_GameTransaction
SELECT 
	stage.gameTransactionId,
    stage.saga_hash,
	stage.saga_real_run_ts,
	stage.transactionTypeId,
	stage.gameSessionId,
	stage.providerRoundUid,
	stage.providerTransactionUid,
	stage.amount,
	stage.afterBalance,
	CAST(CAST(stage.jackpotContribution AS FLOAT) AS INT),
	stage.transactionDate,
	stage.rowCreated,
	stage.rowModified,
	CAST(CAST(stage.roundStatusTypeId AS FLOAT) AS INT),
	stage.roundId,
	stage.liveCasinoTableId,
	stage.cancelTransactionId,
	stage.relatedTransactionId,
	stage.jackpotWin,
	stage.jackpotWinAmount,
	stage.bonusBalance,
	stage.lockedCashBalance,
	stage.lockedCashWinningsBalance,
	stage.riskBonusAmount,
	stage.riskLockedCashAmount,
	stage.riskLockedCashWinningsAmount,
	stage.winBonusAmount,
	stage.winLockedCashAmount,
	stage.winLockedCashWinningsAmount
FROM db_stage.GamingIntegration_tr_GameTransaction AS stage
WHERE 
    stage.saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
ORDER BY 
	saga_real_run_ts ASC
;