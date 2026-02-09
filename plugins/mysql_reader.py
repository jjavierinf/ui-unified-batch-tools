import logging
import pandas as pd
import mysql.connector
from pyspark.sql import Row

class MysqlReader:
    def __init__(self, host, user, password, database, logical_date, port=3306, spark=None):
        self.spark = spark
        self.host = host
        self.user = user
        self.port = port
        self.password = password
        self.database = database
        self.logical_date = logical_date
        self.connection = self.connect_to_mysql()

    def connect_to_mysql(self):
        connection = mysql.connector.connect(
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password,
            database=self.database
        )
        return connection

    def _prepare_query(self, query):
        if '<logical_date>' in query:
            query = query.replace('<logical_date>', self.logical_date)

        logging.info("============= MySQL data read details =============")
        logging.info(f"Host: {self.host}")
        logging.info(f"Database: {self.database}")
        logging.info(f"Logical Date: {self.logical_date}")
        logging.info("----------- Query to run -----------")
        logging.info(query)

        return query

    def read_data_pandas(self, query):
        query = self._prepare_query(query)
        df = pd.read_sql(query, self.connection)
        return df

    def read_data_pandas_as_spark(self, query):
        df = self.read_data_pandas(query)

        if len(df) == 0:
            exit(0)

        # Cast all columns to string
        df = df.astype(str)

        rows = [Row(*record) for record in df.to_records(index=False)]
        spark_df = self.spark.createDataFrame(rows, df.columns.tolist())

        return spark_df
    
    def read_data(self, query=None):
         if not query:
            raise ValueError("Query parameter must not be null")
         
         return self.read_data_pandas(query)

    def read_data_pandas_chunks(self, query, chunk_size=10000):
        query = self._prepare_query(query)
        for chunk in pd.read_sql(query, self.connection, chunksize=chunk_size):
            yield chunk
