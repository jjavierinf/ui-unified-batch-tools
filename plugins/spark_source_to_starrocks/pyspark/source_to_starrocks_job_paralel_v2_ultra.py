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
from mysql_reader import MysqlReader
from starrocks_connector import StarRocksSparkConnector
from etl_log import EtlLog
from common_utilities import create_numeric_hash
from pyspark.sql.functions import udf
from pyspark.sql.types import LongType,TimestampType

# Configuration constants
ET_TIMEZONE = pytz.timezone('US/Eastern')
UTC_TIMEZONE = pytz.timezone('UTC')

class JobConfig:
    def __init__(self, conf):
        self.conf = conf
        self.read_spark_config()
        self.read_source_config()
        self.read_target_config()

    def read_spark_config(self):
        self.source = self.conf.get("source", {})
        self.target = self.conf.get("target", {})
        self.schema = self.conf.get("schema", {})

    def read_source_config(self):
        self.source_type = self.source.get("type", "")
        conn_dict_str = self.source.get("conn_dict")
        conn_dict = json.loads(conn_dict_str)
        self.source_host = conn_dict.get("host")
        self.source_db = conn_dict.get("db")
        self.source_user = conn_dict.get("user")
        self.source_password = conn_dict.get("password")
        self.source_port = conn_dict.get("port")
        self.query = self.source.get("query")
        self.source_schema = self.source.get("schema", "")
        self.source_table = self.source.get("table", "")
        self.read_source_timezone()

    def read_target_config(self):
        self.target_type = self.target.get("type", "")
        if self.target_type is not self.target_type:
            raise ValueError("Only starrocks is allowed as target type")

        self.target_conn = self.target.get("conn_dict")

        self.target_schema = self.target.get("schema", "")
        self.target_database = self.target.get("database")
        self.target_table = self.target.get("table")
        self.target_columns = self.target.get("columns")

    def read_source_timezone(self):
        self.source_timezone = self.source.get("source_timezone")
        allowed_tz = ('UTC', 'US/Eastern')
        if self.source_timezone not in allowed_tz:
            raise Exception(f"Invalid timezone {self.source_timezone} not in {allowed_tz}. If {self.source_timezone} is valid, please whitelist it")

EtlLog.measure_duration('extract')
def create_source_dataframe(etl_log, spark, logical_date, job_config):
    if job_config.source_type == 'sql_server':
        src_reader = SQLServerReader(
            job_config.source_host,
            job_config.source_user,
            job_config.source_password,
            job_config.source_db,
            spark=spark
        )
        src_df = src_reader.read_data(
            job_config.source_schema,
            job_config.source_table,
            logical_date=logical_date,
            query=job_config.query,
            num_partitions = 20

        )
    elif job_config.source_type == 'postgres':
        postgres_reader = PostgresReader(
            job_config.source_host,
            job_config.source_user,
            job_config.source_password,
            job_config.source_db,
            logical_date,
            spark
        )
        src_df = postgres_reader.read_data_pandas_as_spark(job_config.query)
    elif job_config.source_type == 'mysql':
        mysql_reader = MysqlReader(
            job_config.source_host,
            job_config.source_user,
            job_config.source_password,
            job_config.source_db,
            logical_date,
            spark = spark,
            port = job_config.source_port

        )
        src_df = mysql_reader.read_data_pandas_as_spark(job_config.query)
    return src_df

def insert_batch(sr_connector, partition_df, starrocks_conn, database_to_write, table_to_write, retry_delay, max_retries):
    for retry in range(max_retries):

        try:
            logging.info(f"Inserting batch on retry number {retry}")
            sr_connector.write_to_starrocks(starrocks_conn, partition_df, database_to_write, table_to_write)
            logging.info(f"Successfully inserted batch")
            time.sleep(retry_delay)
            break

        except Exception as e:
            logging.info(f"Error inserting batch on retry number {retry}: {e}")
            if retry < max_retries - 1:
                logging.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                raise Exception(f"Failed to insert batch after {max_retries} retries: {e}")

def load_data_to_starrocks(spark, src_df, job_config):

    starrocks_conn = job_config.target_conn
    database_to_write = job_config.target_database
    table_to_write = job_config.target_table
    max_retries = 2
    retry_delay = 2

    sr_connector = StarRocksSparkConnector(spark)
    insert_batch(sr_connector, src_df, starrocks_conn, database_to_write, table_to_write, retry_delay, max_retries)

# @EtlLog.measure_duration('transform')
def process_dataframe(job_config, logical_date, src_df: DataFrame) -> DataFrame:
    create_numeric_hash_udf = udf(create_numeric_hash, LongType())

    df = src_df \
        .withColumn("saga_hash", create_numeric_hash_udf(*[F.col(c) for c in src_df.columns])) \
        .withColumn("saga_real_run_ts", lit(F.current_timestamp())) \
        .withColumn("saga_logical_run_ts", lit(logical_date).cast(TimestampType()))\
        .select(job_config.target_columns)
# need to cast logical date to TimestampType
    logging.info(f" ---- Processed Records ------")
    return df

def configure_spark(task_id,):
    spark = SparkSession.builder \
        .appName(task_id) \
        .config("spark.jars.packages", "com.github.housepower:clickhouse-native-jdbc-shaded:2.5.4,com.microsoft.sqlserver:mssql-jdbc:9.4.1.jre8") \
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
        logical_date_to_use = et_datetime.astimezone(pytz.timezone(job_config.source_timezone)).strftime('%Y-%m-%d %H:%M:%S')
        logging.info(f"Passed timezone is {job_config.source_timezone}, logical_date will be (when deployed) {logical_date_to_use}")
    return logical_date_to_use

def main():
    start_time = time.time()

    execution_date_et = sys.argv[1]
    task_id = sys.argv[2]
    conf_str = sys.argv[3]

    spark = configure_spark(task_id)
    sc = spark.sparkContext
    sc.addPyFile("/opt/airflow/data/plugins/common_utilities.py")  # Replace with the actual path

    et_datetime = ET_TIMEZONE.localize(datetime.strptime(execution_date_et, '%Y-%m-%d %H:%M:%S'))
    utc_datetime = et_datetime.astimezone(UTC_TIMEZONE)
    execution_date_utc = utc_datetime.strftime('%Y-%m-%d %H:%M:%S')

    try:
        conf = json.loads(conf_str)
        job_config = JobConfig(conf)

        job_id = f"{task_id}_{execution_date_utc.replace(' ', '_').replace(':', '')}"
        job_type = task_id.split('_')[-1]
        etl_log = EtlLog(job_id, job_type, task_id)

        logical_date = get_logical_date(execution_date_et, et_datetime, execution_date_utc, job_config)
        logging.info(f"Derived logical date: {logical_date}")

        src_df = create_source_dataframe(etl_log, spark, logical_date=logical_date, job_config=job_config)

        # records = src_df.count()
        etl_log.set_records_count(1)
        # logging.info(f"Going to insert: {records} Records")
        # src_df = src_df.repartition(20000)

        df = process_dataframe( job_config, logical_date, src_df)
        load_data_to_starrocks( spark, df, job_config)

    except Exception as e:
        etl_log.success = False  # Mark the phase as failed
        etl_log.error_message = str(e)  # Store the error message
        print(e)
        print("----------------- ERROR FOUND -----------------")
        print("----------------- Sleeping for 600 -----------------")
        time.sleep(600)
        raise e

    finally:
        etl_log.set_end_timestamp()
        spark.stop()
        etl_log.calculate_durations()
        etl_log.log_job_metrics()
        # etl_log.load_to_starrocks(json.loads(job_config.target_conn))
    spark.stop()

if __name__ == "__main__":
    main()
