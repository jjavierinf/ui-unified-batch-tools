import logging
import json
import pytz
import hashlib
from datetime import datetime
import sys
sys.path.append("/opt/airflow/data/plugins")
from sql_server_reader import SQLServerReader
from starrocks_loader import StarRocksClient
from mysql_reader import MysqlReader
from postgres_reader import PostgresReader
from etl_log import EtlLog
from common_utilities import create_numeric_hash

# Configuration constants
ET_TIMEZONE = pytz.timezone('US/Eastern')
UTC_TIMEZONE = pytz.timezone('UTC')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class JobConfig:
    def __init__(self, conf):
        self.conf = conf
        self.read_source_config()
        self.read_target_config()

    def read_source_config(self):
        self.source = self.conf.get("source", {})
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
        self.source_timezone = self.source.get("source_timezone", "UTC")

    def read_target_config(self):
        self.target = self.conf.get("target", {})
        self.target_type = self.target.get("type", "")
        if self.target_type != 'starrocks':
            raise ValueError("Only starrocks is allowed as a target type")

        self.target_conn = self.target.get("conn_dict")
        self.target_schema = self.target.get("schema", "")
        self.target_database = self.target.get("database")
        self.target_table = self.target.get("table")
        self.target_columns = self.target.get("columns", [])

    def get_logical_date(self, execution_date_et):
        et_datetime = ET_TIMEZONE.localize(datetime.strptime(execution_date_et, '%Y-%m-%d %H:%M:%S'))
        if self.source_timezone == 'UTC':
            return et_datetime.astimezone(UTC_TIMEZONE).strftime('%Y-%m-%d %H:%M:%S')
        elif self.source_timezone == 'US/Eastern':
            return et_datetime.astimezone(ET_TIMEZONE).strftime('%Y-%m-%d %H:%M:%S')
        else:
            raise Exception(f"Invalid timezone: {self.source_timezone}. If valid, please whitelist it")


@EtlLog.measure_duration('extract')
def create_source_dataframe(job_config,logical_date):
    if job_config.source_type == 'sql_server':
        src_reader = SQLServerReader(
            job_config.source_host,
            job_config.source_user,
            job_config.source_password,
            job_config.source_db,
        )

        src_df = src_reader.read_data(query=job_config.query, logical_date=logical_date)

    elif job_config.source_type == 'postgres':
        postgres_reader = PostgresReader(
            job_config.source_host,
            job_config.source_user,
            job_config.source_password,
            job_config.source_db,
            logical_date
        )
        src_df = postgres_reader.read_data_pandas(job_config.query)
    elif job_config.source_type == 'mysql':
        mysql_reader = MysqlReader(
            job_config.source_host,
            job_config.source_user,
            job_config.source_password,
            job_config.source_db,
            logical_date,
            port = job_config.source_port
        )
        src_df = mysql_reader.read_data_pandas(job_config.query)
    return src_df


@EtlLog.measure_duration('load')
def load_data_to_starrocks(df_to_write, job_config):

    formatted_rows = []
    columns = df_to_write.columns
    # Iterate through the Spark DataFrame and extract data
    for index, row in df_to_write.iterrows():
        # Get all column values for the current row
        formatted_row = [row[column] for column in columns]
        formatted_rows.append(formatted_row)

    starrocks_conn = json.loads(job_config.target_conn)


    # Initialize the StarRocksClient
    client = StarRocksClient(
        host=starrocks_conn['be_host'],
        port="8040",
        database=job_config.target_database,
        username=starrocks_conn['user'],
        password=starrocks_conn['password'],
        table=job_config.target_table,
        columns=",".join(df_to_write.columns),
        sep="<~>",
        timeout=86400,
    )
    client._load_from_memory_as_json(data=formatted_rows)


@EtlLog.measure_duration('transform')
def process_dataframe(job_config, src_df,logical_date):
    # Calculate the saga_hash column
    src_df['saga_hash'] = src_df.apply(lambda row: create_numeric_hash(*row), axis=1)


    # Add saga_real_run_ts and saga_logical_run_ts columns
    src_df['saga_real_run_ts'] = datetime.now()
    src_df['saga_logical_run_ts'] = logical_date

    # Select the desired columns based on job_config.target_columns
    df = src_df[job_config.target_columns]

    return df


def execute_etl(execution_date_et, task_id, conf):
    et_datetime = ET_TIMEZONE.localize(datetime.strptime(execution_date_et, '%Y-%m-%d %H:%M:%S'))
    utc_datetime = et_datetime.astimezone(UTC_TIMEZONE)
    execution_date_utc = utc_datetime.strftime('%Y-%m-%d %H:%M:%S')
    logger.info(f"Converted execution_date from ET to UTC: {execution_date_utc}")

    job_id = f"{task_id}_{execution_date_utc.replace(' ', '_').replace(':', '')}"
    job_type = task_id.split('_')[-1]
    etl_log = EtlLog(job_id, job_type, task_id)

    try:
        job_config = JobConfig(conf)
        logger.info(job_config)
        logical_date = job_config.get_logical_date(execution_date_et)

        src_df = create_source_dataframe(etl_log, job_config,logical_date)
        df = process_dataframe(etl_log, job_config, src_df,logical_date)
        
        # Set records count in etl_log
        etl_log.set_records_count(len(df))
        
        load_data_to_starrocks(etl_log, df, job_config)
        etl_log.success = True
        # Re-raise the exception to propagate it further

    except Exception as e:
        etl_log.success = False  # Mark the phase as failed
        etl_log.error_message = str(e)  # Store the error message
        raise e

    finally:
        etl_log.set_end_timestamp()
        etl_log.calculate_durations()
        etl_log.log_job_metrics()
        etl_log.load_to_starrocks(job_config.target_conn)
