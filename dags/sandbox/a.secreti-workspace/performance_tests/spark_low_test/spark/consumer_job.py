from pyspark.sql import SparkSession
from pyspark.sql.functions import col
from consumer_model import schema
import argparse
import json
import logging

parser = argparse.ArgumentParser()
parser.add_argument("postgres_production_conn")
parser.add_argument("starrocks_conn")
args = parser.parse_args()

try:
    postgres_conn = json.loads(args.postgres_production_conn)
    starrocks_conn = json.loads(args.starrocks_conn)
except json.JSONDecodeError as e:
    logging.error(f"Error Decoding JSON: {e}")
    raise

spark = SparkSession.builder \
    .appName("SparkLowTest") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

spark.read \
    .format("jdbc") \
    .option("url", f"jdbc:postgresql://{postgres_conn['host']}:5432/production") \
    .option("user", postgres_conn["user"]) \
    .option("password", postgres_conn["password"]) \
    .option("driver", "org.postgresql.Driver") \
    .option("query", "SELECT * FROM chat.form_submission_select_options") \
    .schema(schema) \
    .load() \
    .select(
        col("create_date_time").alias("create_date_time"),
        col("update_date_time").alias("update_date_time"),
        col("form_submission_select_option_id").alias("form_submission_select_option_id"),
        col("form_submission_field_id").alias("form_submission_field_id"),
        col("select_option_id").alias("select_option_id")
    ) \
    .write \
    .format("starrocks") \
    .option("starrocks.fe.http.url", f"{starrocks_conn['host']}:8030") \
    .option("starrocks.fe.jdbc.url", f"jdbc:mysql://{starrocks_conn['host']}:9030") \
    .option("starrocks.table.identifier", "db_stage_DEVELOP.spark_low_test") \
    .option("starrocks.user", starrocks_conn['user']) \
    .option("starrocks.password", starrocks_conn['password']) \
    .option("starrocks.write.properties.format", "json") \
    .option("starrocks.write.ctl.enable-transaction", "true") \
    .mode("append") \
    .save() 
    
spark.stop()