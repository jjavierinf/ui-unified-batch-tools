from pyspark.sql.types import StructType, StructField, TimestampType, IntegerType

# Define the schema
schema = StructType([
    StructField("create_date_time", TimestampType(), True),
    StructField("update_date_time", TimestampType(), True),
    StructField("form_submission_select_option_id", IntegerType(), True),
    StructField("form_submission_field_id", IntegerType(), True),
    StructField("select_option_id", IntegerType(), True)
])