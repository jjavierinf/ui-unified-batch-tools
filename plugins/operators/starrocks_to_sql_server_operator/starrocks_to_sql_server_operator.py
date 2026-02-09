import logging
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
import sys
sys.path.append("/opt/airflow/data/plugins")
from mysql_reader import MysqlReader
from sql_server_writter import SQLServerWriter

class StarRocksToSQLServerOperator(BaseOperator):
    @apply_defaults
    def __init__(self, starrocks_conn, sqlserver_conn, query, schema, table, logical_date, chunk_size=0, spark=None, dry_run=False, if_exists='append', *args, **kwargs):
        super(StarRocksToSQLServerOperator, self).__init__(*args, **kwargs)
        self.starrocks_conn = starrocks_conn
        self.sqlserver_conn = sqlserver_conn
        self.query = query
        self.schema = schema
        self.table = table
        self.logical_date = logical_date
        self.chunk_size = chunk_size
        self.spark = spark
        self.dry_run = dry_run
        self.if_exists = if_exists

    def execute(self, context):
        reader = MysqlReader(
            host=self.starrocks_conn['host'],
            user=self.starrocks_conn['user'],
            password=self.starrocks_conn['password'],
            database=self.starrocks_conn['db'],
            logical_date=self.logical_date,
            port=self.starrocks_conn['port'],
            spark=self.spark,
        )

        writer = SQLServerWriter(
            host=self.sqlserver_conn['host'],
            user=self.sqlserver_conn['user'],
            password=self.sqlserver_conn['password'],
            database=self.sqlserver_conn['db']
        )

        if self.if_exists == 'replace':
            if not self.dry_run:
                # Truncate the table before loading data
                with writer.engine.connect() as connection:
                    connection.execute(f"TRUNCATE TABLE {self.schema}.{self.table}")
                logging.info(f"Table {self.schema}.{self.table} truncated")

        if self.chunk_size > 0:
            for i, chunk in enumerate(reader.read_data_pandas_chunks(self.query, self.chunk_size)):
                logging.info(f"Processing chunk {i + 1}")
                if self.dry_run:
                    logging.info(f"Dry run: Would write chunk {i + 1} with {len(chunk)} rows to {self.schema}.{self.table}")
                else:
                    writer.write_data(chunk, self.schema, self.table, if_exists='append')
        else:
            df = reader.read_data_pandas(self.query)
            logging.info(f"Processing entire dataset with {len(df)} rows")
            if self.dry_run:
                logging.info(f"Dry run: Would write entire dataset with {len(df)} rows to {self.schema}.{self.table}")
            else:
                writer.write_data(df, self.schema, self.table, if_exists=self.if_exists)
