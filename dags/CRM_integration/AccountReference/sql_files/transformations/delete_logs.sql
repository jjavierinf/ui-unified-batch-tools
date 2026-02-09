DELETE FROM db_stage.Accounts_dbo_AccountReference 
WHERE saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et }}', INTERVAL 3 MONTH)
;