TRUNCATE TABLE db_data_model.Accounts_dbo_AccountLogType
;

INSERT INTO db_data_model.Accounts_dbo_AccountLogType
SELECT 
    accountLogTypeID,
	saga_hash,
	saga_real_run_ts,
	typeName,
	rowCreated,
	rowModified
FROM db_stage.Accounts_dbo_AccountLogType
WHERE saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}' 
ORDER BY saga_real_run_ts ASC
;