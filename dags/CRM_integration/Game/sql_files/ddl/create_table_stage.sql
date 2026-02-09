CREATE TABLE IF NOT EXISTS db_stage.GamingIntegration_gc_Game (
    saga_hash BIGINT, 
    saga_real_run_ts DATETIME, 
    saga_logical_run_ts DATETIME, 
    gameID STRING, 
    gameTypeID STRING, 
    gameSubTypeID STRING, 
    name STRING, 
    gamingGroupingKey STRING, 
    hasJackpot STRING, 
    freeRoundsSupported STRING, 
    aspectRatio STRING, 
    width STRING, 
    height STRING, 
    scaleUp STRING, 
    scaleDown STRING, 
    stretching STRING, 
    html5 STRING, 
    rowCreated STRING, 
    rowModified STRING, 
    isDeleted STRING, 
    platformID STRING, 
    title STRING, 
    subtitle STRING
)
PRIMARY KEY (saga_hash)
DISTRIBUTED BY HASH (saga_hash)
PROPERTIES(
    "replication_num" = "2" ,
    "enable_persistent_index" = "true"
);