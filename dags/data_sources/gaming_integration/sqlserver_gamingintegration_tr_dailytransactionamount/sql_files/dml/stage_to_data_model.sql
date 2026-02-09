INSERT INTO db_data_model.gamingintegration_tr_dailytransactionamount
WITH data_rownum AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY `dailyTransactionAmountID`								
                               ORDER BY saga_real_run_ts DESC) 
                                     AS rn
    FROM db_stage.gamingintegration_tr_dailytransactionamount
    WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
)
SELECT 
    `dailyTransactionAmountID`,
	`saga_hash`,
	`saga_real_run_ts`,
	upper(trim(`customerID`)),
	`balance`,
	`balanceDate`,
	`rowCreated`,
	`rowModified`,
	`gameTransactionID`
FROM data_rownum
WHERE rn = 1;