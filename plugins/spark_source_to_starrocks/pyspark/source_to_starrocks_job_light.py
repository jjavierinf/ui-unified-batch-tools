import sys 
sys.path.append("/opt/airflow/data/plugins")
import logging
import json
import pytz
import hashlib

from datetime import datetime
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import lit
import pyspark.sql.functions as F
from postgres_reader import PostgresReader
from starrocks_loader import StarRocksClient
from sql_server_reader import SQLServerReader
from etl_log import EtlLog
from common_utilities import create_numeric_hash
from pyspark.sql.functions import udf
from pyspark.sql.types import LongType,TimestampType
import pandas as pd 

# Configuration constants
ET_TIMEZONE = pytz.timezone('US/Eastern')
UTC_TIMEZONE = pytz.timezone('UTC')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

@EtlLog.measure_duration('extract')
def create_source_dataframe(spark, logical_date, job_config):
    if job_config.source_type == 'sql_server':
        src_reader = SQLServerReader(
            job_config.sql_server_host,
            job_config.sql_server_user,
            job_config.sql_server_password,
            job_config.sql_server_db,
        )
        src_df = src_reader.read_data(query = job_config.query, logical_date = logical_date)
        # src_df = spark.createDataFrame(pandas_df)

    elif job_config.source_type == 'postgres':
        postgres_reader = PostgresReader(
            job_config.postgres_host,
            job_config.postgres_user,
            job_config.postgres_password,
            job_config.postgres_db,
            logical_date,
            spark = spark
        )
        src_df = postgres_reader.read_data_pandas(job_config.postgres_query)

    logging.info(f"============ Going to insert {src_df.count()} Records on {job_config.starrocks_database}.{job_config.starrocks_table}  ============")
    return src_df

@EtlLog.measure_duration('load')
def load_data_to_starrocks_python(df_to_write, job_config):
    formatted_rows = []
    columns = df_to_write.columns
    # Iterate through the Spark DataFrame and extract data
    for index, row in df_to_write.iterrows():
        # Get all column values for the current row
        formatted_row = [row[column] for column in columns]
        formatted_rows.append(formatted_row)
        
    starrocks_conn = json.loads(job_config.starrocks_conn)
    
    
    # Initialize the StarRocksClient
    client = StarRocksClient(
        host=starrocks_conn['be_host'],
        port="8040",
        database="db_stage",
        username=starrocks_conn['user'],
        password=starrocks_conn['password'],
        table=job_config.starrocks_table,
        columns = ",".join(df_to_write.columns),
        sep="<~>",
        timeout=86400,
    )
    client.load(data=formatted_rows)

@EtlLog.measure_duration('transform')
def process_dataframe(job_config, logical_date, src_df: DataFrame) -> DataFrame:
    # Calculate the saga_hash column
    src_df['saga_hash'] = src_df.apply(lambda row: create_numeric_hash(*row), axis=1)

    # Add saga_real_run_ts and saga_logical_run_ts columns
    src_df['saga_real_run_ts'] = datetime.now()
    src_df['saga_logical_run_ts'] = logical_date

    # Select the desired columns based on job_config.starrocks_columns
    df = src_df[job_config.starrocks_columns]

    return df

def configure_spark(task_id):
    spark = SparkSession.builder \
        .appName(task_id) \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
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
    return logical_date_to_use

def main():

    execution_date_et = sys.argv[1]
    task_id = sys.argv[2]


    # Configure Spark
    spark = configure_spark(task_id)
    logger.info(f"Configured Spark for task_id: {task_id}")
    sc = spark.sparkContext
    sc.addPyFile("/opt/airflow/data/plugins/common_utilities.py")  # Replace with the actual path

    et_datetime = ET_TIMEZONE.localize(datetime.strptime(execution_date_et, '%Y-%m-%d %H:%M:%S'))
    utc_datetime = et_datetime.astimezone(UTC_TIMEZONE)
    execution_date_utc = utc_datetime.strftime('%Y-%m-%d %H:%M:%S')
    logger.info(f"Converted execution_date from ET to UTC: {execution_date_utc}")

    try:
        job_config = JobConfig(spark, execution_date_et, task_id)
        job_config.read_spark_config()
        logger.info("Read Spark configuration")

        job_id = f"{task_id}_{execution_date_utc.replace(' ', '_').replace(':', '')}"
        job_type = task_id.split('_')[-1]
        etl_log = EtlLog(job_id, job_type, task_id)
        
        logical_date = get_logical_date(execution_date_et, et_datetime, execution_date_utc, job_config)
        logger.info(f"Derived logical date: {logical_date}")

        src_df = create_source_dataframe(etl_log, spark, logical_date=logical_date, job_config=job_config)
        logger.info(f"Created source dataframe with count: {src_df.count()}")
        # Set records count in etl_log
        etl_log.set_records_count(len(src_df))

        df = process_dataframe(etl_log, job_config, logical_date, src_df)
        logger.info(f"Processed dataframe with count: {df.count()}")

        load_data_to_starrocks_python(etl_log ,df, job_config)
        logger.info("============ Loaded data to StarRocks ============")
        etl_log.success = True

    except Exception as e:
        etl_log.success = False  # Mark the phase as failed
        etl_log.error_message = str(e)  # Store the error message
        raise e

    finally:
        etl_log.set_end_timestamp()
        spark.stop()
        logger.info("Stopped Spark session")
        etl_log.calculate_durations()
        etl_log.log_job_metrics()  
        etl_log.load_to_starrocks(json.loads(job_config.starrocks_conn))


if __name__ == "__main__":
    main()
