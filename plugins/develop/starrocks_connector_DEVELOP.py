from typing import Dict

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql.functions import regexp_replace, current_timestamp


class StarRocksSparkConnector_DEVELOP:
    """
    A class for connecting to and interacting with StarRocks using PySpark.

    Args:
        spark (SparkSession): The SparkSession to use.
    """

    def __init__(self, spark: SparkSession):
        self.spark = spark

    
    def write_to_starrocks(self, df: DataFrame, database: str, table: str) -> None:
        """
        Write a DataFrame to a StarRocks table.

        Args:
            df (DataFrame): The DataFrame to write.
            database (str): The name of the StarRocks database.
            table (str): The name of the StarRocks table.
        """
        # Get the DataFrame columns and create the options dictionary
        options = {
            # TODO:conn details should be secret
            "starrocks.fe.http.url": "10.111.211.79:8030",
            "starrocks.fe.jdbc.url": f"jdbc:mysql://10.111.211.79:9030/{database}",
            "starrocks.table.identifier": database + "." + table,     
            "starrocks.user": "root",
            "starrocks.password": "",
            "spark.starrocks.conf": "write",
            "starrocks.write.properties.format": "json",
            "spark.starrocks.write.properties.enclose": "'",
            "spark.starrocks.write.properties.columnSeparator": "|",
            "spark.starrocks.write.properties.column_separator": "|",
            "spark.starrocks.write.ctl.enable-transaction": True
        }

        # Write the DataFrame to StarRocks
        df.write.format("starrocks").mode("append").options(**options).save()

    # TODO: needs to be reworked
    def read_from_starrocks(self, database: str, table: str) -> DataFrame:
        """
        Read data from a StarRocks table into a DataFrame.

        Args:
            database (str): The name of the StarRocks database.
            table (str): The name of the StarRocks table.

        Returns:
            DataFrame: The DataFrame containing the retrieved data.
        """
        # Read data from StarRocks into a DataFrame
        options = {
            "spark.starrocks.conf": "read",
            "spark.starrocks.read.fe.urls.http": self.connection["url"],
            "spark.starrocks.read.fe.urls.jdbc": f'jdbc:mysql://{self.connection["url"]}/{database}',
            "spark.starrocks.read.database": database,
            "spark.starrocks.read.table": table,
            "spark.starrocks.read.username": self.connection["username"],
            "spark.starrocks.read.password": self.connection["password"],
        }

        df = self.spark.read.format("starrocks_reader").options(**options).load()
        return df
