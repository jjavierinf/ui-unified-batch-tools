CREATE TABLE IF NOT EXISTS db_business_model_DEVELOP.customer_birthdate_aggregation (
    customer_birthdate DATE,
     customer_count BIGINT SUM DEFAULT "0"
) ENGINE=OLAP
AGGREGATE KEY(customer_birthdate)
DISTRIBUTED BY HASH(customer_birthdate) BUCKETS 32
PROPERTIES (
    "replication_num" = "3"
)
;