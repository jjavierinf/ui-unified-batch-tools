CREATE TABLE IF NOT EXISTS db_data_model.GamingIntegration_gc_Game (
    gameID INT, 
    saga_hash BIGINT,
    saga_real_run_ts DATETIME,  
    gameTypeID INT, 
    gameSubTypeID INT, 
    name STRING, 
    gamingGroupingKey INT, 
    hasJackpot BOOLEAN, 
    freeRoundsSupported BOOLEAN, 
    aspectRatio STRING, 
    width INT, 
    height INT, 
    scaleUp BOOLEAN, 
    scaleDown BOOLEAN, 
    stretching BOOLEAN, 
    html5 BOOLEAN, 
    rowCreated DATETIME, 
    rowModified DATETIME, 
    isDeleted INT, 
    platformID INT, 
    title STRING, 
    subtitle STRING
) 
PRIMARY KEY (gameID) 
DISTRIBUTED BY HASH (gameID)
PROPERTIES(
    "replication_num" = "2", 
    "enable_persistent_index" = "true"
);