import logging

class SQLServerReader_DEVELOP:
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

    def __init__(self, spark, host, user, password, database):
        self.spark = spark
        self.host = host
        self.user = user
        self.password = password
        self.database = database

    def _construct_query(self, schema, table, mode="snapshot", date_fields=None, execution_date_et=None, lookback_minutes=None, other_conditions=None, sql_server_where_condition=None):
        
        if sql_server_where_condition:
            query = f"SELECT * FROM [{schema}].[{table}] WHERE {sql_server_where_condition.replace('{logical_date}', execution_date_et)}"
            mode = 'Fixed Where condition'
        else:
            if mode == "snapshot":
                query = f"SELECT * FROM [{schema}].[{table}] "
            elif mode == "incremental" and date_fields and execution_date_et and lookback_minutes:
                date_conditions = " OR ".join([f"({field} <= '{execution_date_et}' AND {field} > DATEADD(MINUTE, -{lookback_minutes}, '{execution_date_et}'))" for field in date_fields])
                query = f"SELECT * FROM [{schema}].[{table}] WHERE {date_conditions}"
            if other_conditions:
                if mode == "incremental":
                    query += f" AND ({other_conditions})"
                else:
                    query += f" WHERE ({other_conditions})"
            # else:
            #     raise ValueError("Invalid mode or missing parameters for incremental mode. Please provide 'date_fields', 'execution_date_et', and 'lookback_minutes'.")

        logging.info("=" * 20 + " Query Debugging " + "=" * 20)
        logging.info(f"Constructed query: {query}")
        logging.info(f"Mode: {mode}")
        logging.info(f"Schema: {schema}")
        logging.info(f"Table: {table}")
        logging.info(f"Execution Date: {execution_date_et}")
        if mode == 'incremental':
            logging.info(f"Incremental Fields: {date_fields}")
            logging.info(f"Lookback Minutes: {lookback_minutes}")
        logging.info("=" * 54)
        return query

    

    def read_data(self, schema, table, mode="snapshot", date_fields=None, execution_date_et=None, lookback_minutes=None, other_conditions=None, sql_server_where_condition=None):
        """
        Read data from SQL Server.

        Args:
            schema (str): The SQL Server schema.
            table (str): The SQL Server table.
            mode (str, optional): The query mode. Can be "snapshot" or "incremental". Defaults to "snapshot".
            date_fields (list of str, optional): List of date fields used for incremental queries. Required in "incremental" mode.
            execution_date_et (str, optional): The execution date for incremental query. Required in "incremental" mode.
            lookback_minutes (int, optional): The number of minutes to look back for incremental query. Required in "incremental" mode.
            other_conditions (str, optional): Additional SQL conditions to apply to the query.
            sql_server_where_condition (str, optional): An SQL WHERE condition to override other conditions.

        Returns:
            pyspark.sql.DataFrame: A DataFrame containing the queried data.
        """

        # Construct the connection string
        conn_string = f"jdbc:sqlserver://{self.host};database={self.database};user={self.user};password={self.password}"

        # Set the default query if not provided
        query = self._construct_query(schema, table, mode, date_fields, execution_date_et, lookback_minutes, other_conditions,sql_server_where_condition)

        # Read data using Spark
        df = self.spark.read.format("jdbc").option("url", conn_string).option("query", query).option("fetchsize", "20000").option("driver", "com.microsoft.sqlserver.jdbc.SQLServerDriver").load()
        

        return df

