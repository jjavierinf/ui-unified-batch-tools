DELETE FROM db_stage.GamingIntegration_gc_Game 
WHERE 

    saga_logical_run_ts < DATE_SUB('{{ ts | convert_utc_to_et("US/Eastern") }}', INTERVAL 90 DAY)

;