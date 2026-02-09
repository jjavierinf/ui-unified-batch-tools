import logging
import json
import pytz
import hashlib
from datetime import datetime
import sys 
sys.path.append("/opt/airflow/data/plugins")
from sql_server_reader import SQLServerReader
from starrocks_loader import StarRocksClient
from postgres_reader import PostgresReader
from etl_log import EtlLog
from common_utilities import create_numeric_hash

# Configuration constants
ET_TIMEZONE = pytz.timezone('US/Eastern')
UTC_TIMEZONE = pytz.timezone('UTC')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class JobConfig:
    def __init__(self, conf, execution_date_et, task_id, root_key='python'):
        self.conf = conf
        self.execution_date_et = execution_date_et
        self.task_id = task_id
        self.root_key = root_key
        self.read_config()

    def calculate_logical_date(self):
        et_datetime = ET_TIMEZONE.localize(datetime.strptime(self.execution_date_et, '%Y-%m-%d %H:%M:%S'))
        utc_datetime = et_datetime.astimezone(UTC_TIMEZONE)
        
        if self.source_type == 'sql_server':
            logical_date = self.execution_date_et
            # logger.info(f"Timezone is not defined, defaulted to ET, logical_date will be {logical_date}")
        elif self.source_type == 'postgres':
            logical_date = utc_datetime.strftime('%Y-%m-%d %H:%M:%S')
            # logger.info(f"Timezone is not defined, defaulted to UTC, logical_date will be {logical_date}")

        if hasattr(self, 'source_timezone'):
            logical_date = et_datetime.astimezone(pytz.timezone(self.source_timezone)).strftime('%Y-%m-%d %H:%M:%S')
            # logger.info(f"Passed timezone is {self.source_timezone}, logical_date will be {logical_date}")
        self.logical_date = logical_date
        # return logical_date
        
    def read_config(self):
        self.source_type = self.conf.get(f"{self.root_key}.source")

        if self.source_type == 'sql_server':
            self.read_sql_reader_config()
        elif self.source_type == 'postgres':
            self.read_postgres_config()

        self.read_starrocks_config()
        self.read_source_timezone()
        self.calculate_logical_date()
        
    def read_source_timezone(self):
        tz = self.conf.get(f"{self.root_key}.{self.source_type}.source_timezone", 'UTC')
        whitelisted_tz = ('UTC', 'US/Eastern')
        if tz in whitelisted_tz:
            self.source_timezone = tz
        else: 
            raise Exception(f"Invalid timezone {tz} not in {whitelisted_tz}. If {tz} is valid, please whitelist it")

    def read_sql_reader_config(self):
        self.sql_server_schema = self.conf.get(f"{self.root_key}.sql_server.schema")
        self.sql_server_table = self.conf.get(f"{self.root_key}.sql_server.table")
        self.sql_server_where_condition = self.conf.get(f"{self.root_key}.sql_server.where_condition", "")
        self.sql_server_conn = json.loads(self.conf.get(f"{self.root_key}.sql_server.conn"))
        self.sql_server_host = self.sql_server_conn['host']
        self.sql_server_db = self.sql_server_conn['db']
        self.sql_server_user = self.sql_server_conn['user']
        self.sql_server_password = self.sql_server_conn['password']
        self.query = self.conf.get(f"{self.root_key}.sql_server.query", None)

    def read_postgres_config(self):
        self.postgres_query = self.conf.get(f"{self.root_key}.postgres.query")
        self.postgres_conn = json.loads(self.conf.get(f"{self.root_key}.postgres.conn"))
        self.postgres_host = self.postgres_conn['host']
        self.postgres_db = self.postgres_conn['db']
        self.postgres_user = self.postgres_conn['user']
        self.postgres_password = self.postgres_conn['password']

    def read_starrocks_config(self):
        self.starrocks_database = self.conf.get(f"{self.root_key}.starrocks.database")
        self.starrocks_table = self.conf.get(f"{self.root_key}.starrocks.table")
        self.starrocks_columns = self.conf.get(f"{self.root_key}.starrocks.columns").split(',')
        self.starrocks_conn = self.conf.get(f"{self.root_key}.starrocks.conn")
    
@EtlLog.measure_duration('extract')
def create_source_dataframe(job_config):
    if job_config.source_type == 'sql_server':
        src_reader = SQLServerReader(
            job_config.sql_server_host,
            job_config.sql_server_user,
            job_config.sql_server_password,
            job_config.sql_server_db,
        )
        
        src_df = src_reader.read_data(query = job_config.query, logical_date=job_config.logical_date)

    elif job_config.source_type == 'postgres':
        postgres_reader = PostgresReader(
            job_config.postgres_host,
            job_config.postgres_user,
            job_config.postgres_password,
            job_config.postgres_db,
            job_config.logical_date
        )
        src_df = postgres_reader.read_data_pandas(job_config.postgres_query)
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
    client._load_from_memory_as_json(data=formatted_rows)

@EtlLog.measure_duration('transform')
def process_dataframe(job_config, src_df):
    # Calculate the saga_hash column
    src_df['saga_hash'] = src_df.apply(lambda row: create_numeric_hash(*row), axis=1)

    # Add saga_real_run_ts and saga_logical_run_ts columns
    src_df['saga_real_run_ts'] = datetime.now()
    src_df['saga_logical_run_ts'] = job_config.logical_date

    # Select the desired columns based on job_config.starrocks_columns
    df = src_df[job_config.starrocks_columns]

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
        job_config = JobConfig(conf, execution_date_et, task_id)
        job_config.read_config()

        src_df = create_source_dataframe(etl_log, job_config)
        df = process_dataframe(etl_log, job_config, src_df)
        
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
        etl_log.load_to_starrocks(json.loads(job_config.starrocks_conn))