import sys 
sys.path.append("/opt/airflow/data/plugins")
import logging
import json
import time
import pytz
from datetime import datetime
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import lit
import pyspark.sql.functions as F
import pandas as pd
from sql_server_reader import SQLServerReader
from postgres_reader import PostgresReader
from starrocks_connector import StarRocksSparkConnector
from starrocks_loader import StarRocksClient
from pyspark import SparkContext
import requests
import subprocess
import os
from etl_log import EtlLog


# Configuration constants
ET_TIMEZONE = pytz.timezone('US/Eastern')
UTC_TIMEZONE = pytz.timezone('UTC')

class JobConfig:
    def __init__(self, spark, execution_date_et, task_id):
        self.spark = spark
        self.execution_date_et = execution_date_et
        self.task_id = task_id

    def read_spark_config(self):
        self.source_type = self.spark.conf.get("spark.source")

        if self.source_type == 'sql_server':
            self.read_sql_server_config()
        elif self.source_type == 'postgres':
            self.read_postgres_config()

        self.read_starrocks_config()
        self.read_general_config()
        self.read_sql_reader_config()
        self.read_source_timezone()

    def read_sql_server_config(self):
        self.sql_server_schema = self.spark.conf.get("spark.sql_server.schema",None)
        self.sql_server_table = self.spark.conf.get("spark.sql_server.table",None)
        self.sql_server_where_condition = self.spark.conf.get("spark.sql_server.where_condition", "")
        self.sql_server_conn = json.loads(self.spark.conf.get("spark.sql_server.conn"))
        self.sql_server_host = self.sql_server_conn['host']
        self.sql_server_db = self.sql_server_conn['db']
        self.sql_server_user = self.sql_server_conn['user']
        self.sql_server_password = self.sql_server_conn['password']
        self.query = self.spark.conf.get("spark.sql_server.query", None)

    def read_postgres_config(self):
        self.postgres_query = self.spark.conf.get("spark.postgres.query")
        self.postgres_conn = json.loads(self.spark.conf.get("spark.postgres.conn"))
        self.postgres_host = self.postgres_conn['host']
        self.postgres_db = self.postgres_conn['db']
        self.postgres_user = self.postgres_conn['user']
        self.postgres_password = self.postgres_conn['password']
        
    def read_starrocks_config(self):
        self.starrocks_database = self.spark.conf.get("spark.starrocks.database")
        self.starrocks_table = self.spark.conf.get("spark.starrocks.table")
        self.starrocks_columns = self.spark.conf.get("spark.starrocks.columns").split(',')
        self.starrocks_conn = self.spark.conf.get("spark.starrocks.conn")

    def read_general_config(self):
        self.num_splits = int(self.spark.conf.get("spark.num_splits", '1'))
        self.max_retries = int(self.spark.conf.get("spark.max_retries", '4'))
        self.retry_delay = int(self.spark.conf.get("spark.retry_delay", '30'))

        
    def read_sql_reader_config(self):
        self.query_mode = self.spark.conf.get("spark.query_mode", "snapshot")
        self.date_fields = self.spark.conf.get("spark.date_fields", "").split(',')
        self.lookback_minutes = int(self.spark.conf.get("spark.lookback_minutes", '0'))
        self.other_conditions = self.spark.conf.get("spark.other_conditions", None)

    def read_source_timezone(self):
        tz = self.spark.conf.get(f"spark.{self.source_type}.source_timezone",'UTC')
        whitelisted_tz = ('UTC', 'US/Eastern')
        if tz in whitelisted_tz:
            self.source_timezone = tz
        else: 
            raise Exception(f"Invalid timezone {tz} not in {whitelisted_tz}. If {tz} is valid, please whitelist it")

EtlLog.measure_duration('extract')
def create_source_dataframe(etl_log, spark, logical_date, job_config):
    if job_config.source_type == 'sql_server':
        src_reader = SQLServerReader(
            job_config.sql_server_host,
            job_config.sql_server_user,
            job_config.sql_server_password,
            job_config.sql_server_db,
            spark
        )
        src_df = src_reader.read_data(
            job_config.sql_server_schema,
            job_config.sql_server_table,
            mode=job_config.query_mode,
            date_fields=job_config.date_fields,
            logical_date=logical_date,
            lookback_minutes=job_config.lookback_minutes,
            other_conditions=job_config.other_conditions,
            sql_server_where_condition=job_config.sql_server_where_condition,
            query = job_config.query,
            num_partitions = 40
        )
    elif job_config.source_type == 'postgres':
        postgres_reader = PostgresReader(
            job_config.postgres_host,
            job_config.postgres_user,
            job_config.postgres_password,
            job_config.postgres_db,
            logical_date,
            spark
        )
        src_df = postgres_reader.read_data_pandas_as_spark(job_config.postgres_query)
    logging.info(f"============ Going to insert Records on {job_config.starrocks_database}.{job_config.starrocks_table}  ============")
   
    return src_df 
    
def validate_configuration(num_splits, max_retries, retry_delay):
    if num_splits < 0:
        raise ValueError("num_splits must be greater than 0")

    if max_retries <= 0 or max_retries > 10:
        raise ValueError("max_retries must be between 1 and 10")

    if retry_delay < 10 or retry_delay > 120:
        raise ValueError("retry_delay must be between 10 seconds and 2 minutes (120 seconds)")

def load_data_to_clickhouse(src_df,job_config):
    host = "10.99.182.252"
    user = "admin"
    password = "test"
    port = 9000
    database_name = job_config.starrocks_database
    # table_name = "db_stage.ASIDb_dbo_CustomerExtended_Audit"
    table_name = job_config.starrocks_table
    url = f"jdbc:clickhouse://{host}:{port}/{database_name}"

    src_df.write \
    .format('jdbc') \
    .option('driver', "com.github.housepower.jdbc.ClickHouseDriver") \
    .option('url', url) \
    .option('user', user) \
    .option('password', password) \
    .option('dbtable', table_name) \
    .mode('append') \
    .save()

    logging.info(f"Dataframe written to {table_name}")

@EtlLog.measure_duration('transform')
def process_dataframe(job_config, logical_date, src_df: DataFrame) -> DataFrame:
    # Cast all columns to string
    casted_columns = [F.col(c).cast("string").alias(c) for c in src_df.columns]

    df = src_df.select(*casted_columns) \
        .withColumn("saga_hash", F.sha2(F.concat_ws("", *casted_columns), 256)) \
        .withColumn("saga_real_run_ts", lit('F.current_timestamp()')) \
        .withColumn("saga_logical_run_ts", lit('logical_date')) \
        .select(job_config.starrocks_columns)

    records = 10000
    logging.info(f" ---- Processed {records} Records ------")
    return df

def configure_spark(task_id):
    spark = SparkSession.builder \
        .appName(task_id) \
        .config("spark.jars.packages",  "com.github.housepower:clickhouse-native-jdbc-shaded:2.5.4,com.microsoft.sqlserver:mssql-jdbc:9.4.1.jre8") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    spark.conf.set("spark.sql.codegen.wholeStage", False)
    return spark

def get_logical_date(execution_date_et, et_datetime, execution_date_utc, job_config):
    if job_config.source_type == 'sql_server':
        logical_date = execution_date_et
        logging.info(f"Timezone is not defined, defaulted to ET, logical_date will be {logical_date}")

    elif job_config.source_type == 'postgres':
        logical_date = execution_date_utc
        logging.info(f"Timezone is not defined, defaulted to UTC, logical_date will be {logical_date}")

    if job_config.source_timezone:
        logical_date_to_use  = et_datetime.astimezone(pytz.timezone(job_config.source_timezone)).strftime('%Y-%m-%d %H:%M:%S')
        logging.info(f"Passed timezone is {job_config.source_timezone}, logical_date will be (when deployed) {logical_date_to_use}")
    return logical_date

def main():
    start_time = time.time()

    execution_date_et = sys.argv[1]
    task_id = sys.argv[2]

    spark = configure_spark(task_id)
    sc = spark.sparkContext

    et_datetime = ET_TIMEZONE.localize(datetime.strptime(execution_date_et, '%Y-%m-%d %H:%M:%S'))
    utc_datetime = et_datetime.astimezone(UTC_TIMEZONE)
    execution_date_utc = utc_datetime.strftime('%Y-%m-%d %H:%M:%S')

    try:
        job_config = JobConfig(spark, execution_date_et, task_id)
        job_config.read_spark_config()

        job_id = f"{task_id}_{execution_date_utc.replace(' ', '_').replace(':', '')}"
        job_type = task_id.split('_')[-1]
        etl_log = EtlLog(job_id, job_type, task_id)
            
        logical_date = get_logical_date(execution_date_et, et_datetime, execution_date_utc, job_config)
        logging.info(f"Derived logical date: {logical_date}")

        src_df  = create_source_dataframe(etl_log, spark, logical_date=logical_date, job_config=job_config)
        
        src_df = src_df.repartition(40)
        etl_log.set_records_count(1)

        df = process_dataframe(etl_log, job_config, logical_date, src_df)
        
        load_data_to_clickhouse(df, job_config)
    
    except Exception as e:
        etl_log.success = False  # Mark the phase as failed
        etl_log.error_message = str(e)  # Store the error message
        raise e

    finally:
        etl_log.set_end_timestamp()
        spark.stop()
        etl_log.calculate_durations()
        etl_log.log_job_metrics()  
        etl_log.load_to_starrocks(json.loads(job_config.starrocks_conn))
    spark.stop()



if __name__ == "__main__":
    main()
