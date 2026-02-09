
from pyspark.sql import SparkSession
import urllib
import logging
import pandas as pd
import psycopg2
from pyspark.sql import Row

class PostgresReader:
    def __init__(self, host, user, password, db, logical_date, spark = None):
        self.spark = spark
        self.host = host
        self.user = user
        self.password = password
        self.db = db
        self.logical_date = logical_date

    def _prepare_query(self, query):
        encoded_password = urllib.parse.quote(self.password)
        postgres_url = f"postgresql://{self.host}/{self.db}?user={self.user}&password={encoded_password}"

        if '<execution_date_utc>' in query:
            query = query.replace('<execution_date_utc>', self.logical_date)

        if '<logical_date>' in query:
            query = query.replace('<logical_date>', self.logical_date)

        logging.info("============= Postgres data read details =============")
        logging.info(f"Host : {self.host}")
        logging.info(f"db : {self.db}")
        logging.info(f"logical_date : {self.logical_date}")
        logging.info("----------- Query to run -----------")
        logging.info(query)

        return postgres_url, query
    
    def read_data(self, query):
        postgres_url, query = self._prepare_query(query)

        src_reader = self.spark.read.format("jdbc") \
            .option("driver", "org.postgresql.Driver") \
            .option("url", "jdbc:" + postgres_url) \
            .option("query", query) \
            .load()

        return src_reader

    def read_data_pandas(self, query):
        postgres_url, query = self._prepare_query(query)
        print(postgres_url)
        conn = psycopg2.connect(postgres_url)
        df = pd.read_sql_query(query, conn)
        conn.close()

        return df

    def read_data_pandas_as_spark(self, query):
        postgres_url, query = self._prepare_query(query)
        conn = psycopg2.connect(postgres_url)
        df = pd.read_sql_query(query, conn)
        conn.close()

        # Cast all columns to string
        df = df.astype(str)

        rows = [Row(*record) for record in df.to_records(index=False)]
        spark_df = self.spark.createDataFrame(rows, df.columns.tolist())

        return spark_df