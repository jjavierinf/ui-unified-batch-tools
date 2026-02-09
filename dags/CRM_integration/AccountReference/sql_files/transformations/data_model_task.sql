TRUNCATE TABLE db_data_model.Accounts_dbo_AccountReference
;

INSERT INTO 
db_data_model.Accounts_dbo_AccountReference
SELECT 
	upper(trim(customerID)),
	saga_hash,
	saga_real_run_ts,
	lastLoginDateTime,
	lastPasswordResetDateTime,
	lastFailedLoginDateTime,
	lastResetPasswordRequestDateTime,
	lastClickResetPasswordEmailDateTime
FROM db_stage.Accounts_dbo_AccountReference
WHERE 
	saga_logical_run_ts = '{{ ts | convert_utc_to_et }}'
ORDER BY 
	saga_real_run_ts ASC
;