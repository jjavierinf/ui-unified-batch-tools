DELETE FROM db_stage.gamingintegration_tr_dailytransactionamount
WHERE balanceDate < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 2 DAY)
;