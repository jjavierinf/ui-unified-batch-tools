import logging
import pandas as pd
import pymssql

class SQLServerReader:
    # Set the logging configuration
    logging.basicConfig(
        level=logging.INFO,  # Set the desired logging level
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    """
    A class for reading data from SQL Server using PySpark.

    Args:
        spark (pyspark.sql.SparkSession): The Spark session.
        host (str): The SQL Server host.
        user (str): The SQL Server user.
        password (str): The SQL Server password.
        database (str): The SQL Server database.

    Attributes:
        spark (pyspark.sql.SparkSession): The Spark session.
        host (str): The SQL Server host.
        user (str): The SQL Server user.
        password (str): The SQL Server password.
        database (str): The SQL Server database.
    """

    def __init__(self, host, user, password, database, spark = None):
        self.spark = spark
        self.host = host
        self.user = user
        self.password = password
        self.database = database

    def _construct_query(self, schema, table, mode="snapshot", date_fields=None, logical_date=None, lookback_minutes=None, other_conditions=None, sql_server_where_condition=None):
        
        if sql_server_where_condition:
            query = f"SELECT * FROM [{schema}].[{table}] WHERE {sql_server_where_condition.replace('{logical_date}', logical_date)}"
            mode = 'Fixed Where condition'
        else:
            if mode == "snapshot":
                query = f"SELECT * FROM [{schema}].[{table}] "
            elif mode == "incremental" and date_fields and logical_date and lookback_minutes:
                date_conditions = " OR ".join([f"({field} <= DATEADD(MINUTE, {lookback_minutes}, '{logical_date}') AND {field} > '{logical_date}')" for field in date_fields])
                query = f"SELECT * FROM [{schema}].[{table}] WHERE {date_conditions}"
            if other_conditions:
                if mode == "incremental":
                    query += f" AND ({other_conditions})"
                else:
                    query += f" WHERE ({other_conditions})"

        logging.info("=" * 20 + " Query Debugging " + "=" * 20)
        logging.info(f"Constructed query: {query}")
        logging.info(f"Mode: {mode}")
        logging.info(f"Schema: {schema}")
        logging.info(f"Table: {table}")
        logging.info(f"Execution Date: {logical_date}")
        if mode == 'incremental':
            logging.info(f"Incremental Fields: {date_fields}")
            logging.info(f"Lookback Minutes: {lookback_minutes}")
        logging.info("=" * 54)
        return query

    
    def read_data(self, schema=None, table=None, mode="snapshot", date_fields=None, logical_date=None, lookback_minutes=None, other_conditions=None, sql_server_where_condition=None, query=None, num_partitions = 1):
        """
        Read data from SQL Server.

        Args:
            schema (str): The SQL Server schema.
            table (str): The SQL Server table.
            mode (str, optional): The query mode. Can be "snapshot" or "incremental". Defaults to "snapshot".
            date_fields (list of str, optional): List of date fields used for incremental queries. Required in "incremental" mode.
            logical_date (str, optional): The execution date for incremental query. Required in "incremental" mode.
            lookback_minutes (int, optional): The number of minutes to look back for incremental query. Required in "incremental" mode.
            other_conditions (str, optional): Additional SQL conditions to apply to the query.
            sql_server_where_condition (str, optional): An SQL WHERE condition to override other conditions.
            query (str, optional): Custom SQL query to execute.

        Returns:
            pyspark.sql.DataFrame or pd.DataFrame: A DataFrame containing the queried data.
        """

        if not query:
            # Set the default query if not provided
            query = self._construct_query(schema, table, mode, date_fields, logical_date, lookback_minutes, other_conditions, sql_server_where_condition)

        if '<logical_date>' in query:
            query = query.replace('<logical_date>', logical_date)
        logging.info(f" Query: {query}")

        if self.spark:
            # Read data using Spark
            conn_string = f"jdbc:sqlserver://{self.host};database={self.database};user={self.user};password={self.password}"
            if num_partitions != 1:
                spark_df = self.spark.read.format("jdbc") \
                    .option("url", conn_string) \
                    .option("dbtable", f"({query}) as subq") \
                    .option("partitionColumn", 'roundID') \
                    .option("lowerBound", 0) \
                    .option("upperBound", 20000000) \
                    .option("numPartitions", num_partitions) \
                    .option("driver", "com.microsoft.sqlserver.jdbc.SQLServerDriver") \
                    .load()
            else:
                spark_df = self.spark.read.format("jdbc") \
                    .option("url", conn_string) \
                    .option("dbtable", f"({query}) as subq") \
                    .option("driver", "com.microsoft.sqlserver.jdbc.SQLServerDriver") \
                    .load()
            return spark_df
        else:
            # Use pyodbc if Spark is not available
            import pyodbc
            driver = 'Driver={ODBC Driver 18 for SQL Server}'
            conn_string = f"{driver};Server={self.host};Database={self.database};uid={self.user};pwd={self.password};Encrypt=yes;TrustServerCertificate=yes;"
            
            try:
                conn = pyodbc.connect(conn_string)
            except:
                conn  = pymssql.connect(server=self.host, user=self.user, password=self.password, database=self.database, timeout=0, login_timeout=60, charset='UTF-8', as_dict=False, appname=None, port='1433')

            pd_df = pd.read_sql_query(query, conn)
            conn.close()
            logging.info(pd_df.count())
            return pd_df




