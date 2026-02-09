import sys 
sys.path.append("/opt/airflow/data/plugins/develop/")
import time
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, concat, lit, regexp_replace
import pyspark.sql.functions as F
from pyspark.sql import DataFrame
from sql_server_reader_DEVELOP import SQLServerReader_DEVELOP
from starrocks_connector_DEVELOP import StarRocksSparkConnector_DEVELOP
import logging
from pyspark.sql.functions import current_timestamp, expr

logging.basicConfig(level=logging.info)


def validate_configuration(num_splits, max_retries, retry_delay):
    if num_splits < 0:
        raise ValueError("num_splits must be greater than 0")

    if max_retries <= 0 or max_retries > 10:
        raise ValueError("max_retries must be between 1 and 10")

    if retry_delay < 10 or retry_delay > 120:
        raise ValueError("retry_delay must be between 10 seconds and 2 minutes (120 seconds)")

def split_dataframe(src_df, num_splits):
    split_weights = [1.0] * num_splits
    df_splits = src_df.randomSplit(split_weights, seed=43)
    return df_splits

def insert_batch(sr_connector, partition_df, database_to_write, table_to_write, retry_delay, max_retries):
    for retry in range(max_retries):
        
        try:
            logging.info(f"Inserting batch on retry number {retry}")
            sr_connector.write_to_starrocks(partition_df, database_to_write, table_to_write)
            logging.info(f"Successfully inserted batch")
            time.sleep(retry_delay)
            break

        except Exception as e:
            logging.info(f"Error inserting batch on retry number {retry}: {e}")
            if retry < max_retries - 1:
                logging.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                raise Exception(f"Failed to insert batch after {max_retries} retries: {e}")

def load_data_with_splits(spark, src_df, database_to_write, table_to_write, num_splits, max_retries, retry_delay):
    
    validate_configuration(num_splits, max_retries, retry_delay)
    df_splits = split_dataframe(src_df, num_splits)
    sr_connector = StarRocksSparkConnector(spark)
    src_df.persist()
    logging.info(f"============ Going to insert {src_df.count()} Records on {database_to_write}.{table_to_write}  ============")

    total_batches = len(df_splits)
    successful_batches = 0

    for i, partition_df in enumerate(df_splits):
        logging.info(f"Batch {i} out of {total_batches}")
        insert_batch(sr_connector, partition_df, database_to_write, table_to_write, retry_delay, max_retries)
        successful_batches += 1
    
    logging.info(f"Total batches: {total_batches}, Successful batches: {successful_batches}")
   
def add_timestamps(src_df: DataFrame, execution_date_et: str) -> DataFrame:
    # Add "current_utc_timestamp" column with current UTC timestamp
    df = src_df.withColumn("current_utc_timestamp", current_timestamp())

    # Convert the UTC timestamp to Eastern Time (ET) using expr
    df = df.withColumn("run_ts", expr("from_utc_timestamp(current_utc_timestamp, 'US/Eastern')"))

    # Drop the "current_et_timestamp" column
    df = df.drop("current_utc_timestamp")

    # Add "instance_ts" column with the specified timestamp
    df = df.withColumn("instance_ts", lit(execution_date_et))

    return df

def add_hashed_key(df):
    # Calculate the SHA-256 hash and add it as a new column "ID"
    df = df.withColumn(
        "ID",
        F.sha2(
            F.concat_ws("", *(
                F.col(c).cast("string")
                for c in df.columns
            )),
            256
        )
    )
    
    return df

def reorder_columns(df: DataFrame, optional_columns: list):
    # Get the list of existing columns in the DataFrame
    existing_columns = df.columns

    # Create a list of optional columns that exist in the DataFrame
    existing_optional_columns = [col for col in optional_columns if col in existing_columns]

    # Create the desired column order by placing existing optional columns first,
    # followed by any remaining columns in their original order
    desired_column_order = existing_optional_columns + [col for col in existing_columns if col not in existing_optional_columns]

    # Return the DataFrame with columns in the desired order
    return df.select(*desired_column_order)

def main():
    """
    Main entry point for the Spark job.
    """
    execution_date_et = sys.argv[1]
    task_id = sys.argv[2]
    #TODO check if we could remove line 91 (conn download)
    spark = SparkSession.builder \
        .appName(task_id) \
        .config("spark.jars.packages", "com.microsoft.sqlserver:mssql-jdbc:9.4.1.jre8") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    spark.conf.set("spark.sql.codegen.wholeStage", False)

    # Read configuration from Spark

    # SQL Server configuration
    sql_server_host = spark.conf.get("spark.sql_server.host")
    sql_server_db = spark.conf.get("spark.sql_server.db")
    sql_server_user = spark.conf.get("spark.sql_server.user")
    sql_server_password = spark.conf.get("spark.sql_server.password")
    sql_server_schema = spark.conf.get("spark.sql_server.schema")
    sql_server_table = spark.conf.get("spark.sql_server.table")

    # Optional SQL Server WHERE condition. This will override all other configs like Query mode
    sql_server_where_condition = spark.conf.get("spark.sql_server.where_condition", "")

    # StarRocks configuration
    starrocks_database = spark.conf.get("spark.starrocks.database")
    starrocks_table = spark.conf.get("spark.starrocks.table")
    starrocks_columns = spark.conf.get("spark.starrocks.columns").split(',')

    # General configuration
    num_splits = int(spark.conf.get("spark.num_splits", '1'))
    max_retries = int(spark.conf.get("spark.max_retries", '4'))
    retry_delay = int(spark.conf.get("spark.retry_delay", '30'))

    # Additional parameters for SQLServerReader

    # Query mode: "snapshot" or "incremental"
    query_mode = spark.conf.get("spark.query_mode", "snapshot")

    # Date fields used for incremental queries
    date_fields = spark.conf.get("spark.date_fields", "").split(',')

    # Execution date for incremental queries
    execution_date_et = spark.conf.get("spark.execution_date_et", execution_date_et)

    # Lookback period in minutes for incremental queries
    lookback_minutes = int(spark.conf.get("spark.lookback_minutes", '0'))

    # Additional SQL conditions
    other_conditions = spark.conf.get("spark.other_conditions", None)


    # Initialize SQLServerReader with the required connection parameters and additional parameters
    src_reader = SQLServerReader(
        spark,
        sql_server_host,
        sql_server_user,
        sql_server_password,
        sql_server_db
    )

    # Customize the query based on the additional parameters
    src_df = src_reader.read_data(
        sql_server_schema,
        sql_server_table,
        mode=query_mode,
        date_fields=date_fields,
        execution_date_et=execution_date_et,
        lookback_minutes=lookback_minutes,
        other_conditions=other_conditions,
        sql_server_where_condition = sql_server_where_condition
    )

    # TODO: remove this and add the fields to all (and delete the reoder)
    if task_id == 'extract_and_load_tb_customer_incremental_task':
        src_df = add_hashed_key(src_df)
    
        optional_columns = ["saga_hash", "saga_real_run_ts", "saga_logical_run_ts"]
        src_df = reorder_columns(src_df, optional_columns)
    
    src_df = add_hashed_key(src_df)
    src_df = add_timestamps(src_df,execution_date_et)

    selected_df = src_df.select(starrocks_columns)
    logging.info(f"Columns to be inserted: {selected_df}")
    load_data_with_splits(spark, selected_df, starrocks_database, starrocks_table, num_splits, max_retries, retry_delay)

    spark.stop()

if __name__ == "__main__":
    main()
