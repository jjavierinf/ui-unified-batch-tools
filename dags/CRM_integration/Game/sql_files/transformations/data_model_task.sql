TRUNCATE TABLE db_data_model.GamingIntegration_gc_Game
;

INSERT INTO 
db_data_model.GamingIntegration_gc_Game
SELECT 
	stage.gameID,
	stage.saga_hash,
	stage.saga_real_run_ts, 
	stage.gameTypeID,
	stage.gameSubTypeID,
	stage.name,
	stage.gamingGroupingKey,
	stage.hasJackpot,
	stage.freeRoundsSupported,
	stage.aspectRatio,
	CAST(CAST(stage.width AS FLOAT) AS INT),
	CAST(CAST(stage.height AS FLOAT) AS INT),
	stage.scaleUp,
	stage.scaleDown,
	stage.stretching,
	stage.html5,
	stage.rowCreated,
	stage.rowModified,
	stage.isDeleted,
	stage.platformID,
	stage.title,
	stage.subtitle
FROM db_stage.GamingIntegration_gc_Game AS stage
WHERE 
    stage.saga_logical_run_ts = '{{ ts | convert_utc_to_et("US/Eastern") }}'
ORDER BY 
	saga_real_run_ts ASC
;