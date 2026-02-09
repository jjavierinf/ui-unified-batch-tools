CREATE TABLE IF NOT EXISTS db_report.vip_levels_manual_approval_msp_logs (
    _id STRING,
    createdAt DATETIME,
    published BOOLEAN,
    updatedAt DATETIME,
    retries INT,
    comment STRING
)
PRIMARY KEY (_id , createdAt)
PARTITION BY  date_trunc('month', createdAt)
DISTRIBUTED BY HASH (_id)
PROPERTIES( 
    "enable_persistent_index" = "true"
);