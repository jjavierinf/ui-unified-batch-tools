import logging
from datetime import datetime, timedelta
import sys
import functools
import time
import sys 
sys.path.append("/opt/airflow/data/plugins")
from starrocks_loader import StarRocksClient
import json 

class EtlLog:
    def __init__(self, job_id, job_type, task_id):
        self.job_id = job_id
        self.job_type = job_type
        self.task_id = task_id
        self.start_timestamp = datetime.utcnow()
        self.logical_timestamp = None
        self.extract_duration = 0
        self.transform_duration = 0
        self.load_duration = 0
        self.total_duration = 0
        self.records_count = 0
        self.end_timestamp = None
        self.success = None  # Indicates whether the job was successful (True/False)
        self.error_message = None  # Stores error messages or None if no error occurred

    def calculate_durations(self):
        self.total_duration = self.extract_duration + self.transform_duration + self.load_duration

    def log_job_metrics(self):
        logging.info(f'Job ID: {self.job_id}, Job Type: {self.job_type}, Task ID: {self.task_id}')
        logging.info(f'Start Timestamp: {self.start_timestamp}')
        logging.info(f'Job End Timestamp: {self.end_timestamp}')
        logging.info(f'Extract Duration: {self.extract_duration:.2f} seconds')
        logging.info(f'Transform Duration: {self.transform_duration:.2f} seconds')
        logging.info(f'Load Duration: {self.load_duration:.2f} seconds')
        logging.info(f'Total Duration: {self.total_duration:.2f} seconds')
        logging.info(f'Records Count: {self.records_count}')
        logging.info(f'Success: {self.success}')
        if self.error_message:
            logging.error(f'Error Message: {self.error_message}')

    def load_to_starrocks(self, starrocks_conn_dict):
        log_data = {
            'job_id': self.job_id,
            'job_type': self.job_type,
            'task_id': self.task_id,
            'start_timestamp': self.start_timestamp,
            'end_timestamp': self.end_timestamp,
            'extract_duration': self.extract_duration,
            'transform_duration': self.transform_duration,
            'load_duration': self.load_duration,
            'total_duration': self.total_duration,
            'records_count': self.records_count,
            'success': self.success,
            'error_message': self.error_message,
        }


        
        # Convert all to string so it could be json encoded
        log_data_str = {key: str(value) for key, value in log_data.items()}  # Convert values to strings
        log_data_list = [log_data_str]  # Convert the dictionary to a list of dictionaries
        log_data_json = json.dumps(log_data_list, indent=4)

        # Log the log_data dictionary before inserting it
        logging.info("Log Data Before Inserting:")
        logging.info(log_data_json)

        # Initialize StarRocksClient using information from job_config
        metrics_schema = 'metrics'
        etl_metrics_table = 'etl_metrics'
        
        starrocks_client = StarRocksClient(
            host='10.109.136.26',
            port="8040",
            database= metrics_schema,
            username='root',
            password='starrocks',
            table=etl_metrics_table,
            columns=",".join(log_data.keys()),  # Use the keys from log_data as columns
            sep="<~>",
            timeout=86400,
        )

        # Use the provided StarRocksClient to insert log data into the database
        # status = starrocks_client._load_common(log_data_json,'json')
        # return status
        return 
    
        # CREATE TABLE IF NOT EXISTS metrics.etl_metrics (
        #     job_id STRING,
        #     job_type STRING,
        #     task_id STRING,
        #     start_timestamp DATETIME,
        #     end_timestamp DATETIME,
        #     extract_duration DOUBLE,
        #     transform_duration DOUBLE,
        #     load_duration DOUBLE,
        #     total_duration DOUBLE,
        #     records_count INT,
        #     success BOOLEAN,
        #     error_message STRING)
        #     DUPLICATE KEY (job_id)
        #     DISTRIBUTED BY HASH (job_id) BUCKETS 10
        #     PROPERTIES(
        #         "replication_num" = "1" ,
        #         "enable_persistent_index" = "true"
        #     );
        
    def measure_duration(phase):
        def decorator(func):
            @functools.wraps(func)
            def wrapper(etl_log, *args, **kwargs):
                start_time = time.perf_counter()
                result = func(*args, **kwargs)
                end_time = time.perf_counter()
                duration = timedelta(seconds=end_time - start_time).total_seconds()
                setattr(etl_log, f"{phase}_duration", duration)
                return result
            return wrapper
        return decorator

    def set_end_timestamp(self):
        self.end_timestamp = datetime.utcnow()

    def set_records_count(self, count):
        self.records_count = count

    