from pyspark.sql import SparkSession

# Initialize the PySpark session
spark = SparkSession.builder.appName(
    "PySpark StarRocks Connector Example"
).getOrCreate()

# Load data from a CSV file
csv_file_path = "/mnt/data/casino_transactions_data.csv"
df = spark.read.csv(csv_file_path, header=True, inferSchema=True)


options = {
    "spark.starrocks.write.fe.urls.http": "10.98.135.132:8030",
    "spark.starrocks.write.fe.urls.jdbc": "jdbc:mysql://10.98.135.132:9030/sales",
    "spark.starrocks.write.database": "sales",
    "spark.starrocks.write.table": "transactions_clones",
    "spark.starrocks.write.username": "root",
    "spark.starrocks.write.password": "starrocks",
    "spark.starrocks.conf": "write",
    "spark.starrocks.write.columns": "Brand,type,Method,Currency,Status,Amount,Bonuscash,Promo,FTD,Timestamp",
    "spark.starrocks.write.column.Brand.type": "string",
    "spark.starrocks.write.column.type.type": "string",
    "spark.starrocks.write.column.Method.type": "string",
    "spark.starrocks.write.column.Currency.type": "string",
    "spark.starrocks.write.column.Status.type": "string",
    "spark.starrocks.write.column.Amount.type": "string",
    "spark.starrocks.write.column.Bonuscash.type": "string",
    "spark.starrocks.write.column.Promo.type": "string",
    "spark.starrocks.write.column.FTD.type": "string",
    "spark.starrocks.write.column.Timestamp.type": "string",
    "spark.starrocks.write.properties.format": "csv",
    "spark.starrocks.write.properties.columnSeparator": ",",
    "spark.starrocks.write.properties.column_separator": ",",
    "spark.starrocks.write.ctl.enable-transaction": True,
}

df.write.format("starrocks_writer").mode("append").options(**options).save()

# Stop the Spark session
spark.stop()

# spark-submit --master spark://spark-master-0.spark-headless.spark.svc.cluster.local:7077 --conf spark.jars.ivy=/tmp/.ivy --jars starrocks-spark3_2.12-1.0.0.jar /mnt/data/spark_sr_example.py
# pyspark --master spark://spark-master-0.spark-headless.spark.svc.cluster.local:7077 --conf spark.jars.ivy=/tmp/.ivy --jars starrocks-spark3_2.12-1.0.0.jar
# csv_file_path = "/mnt/data/sales_team_data.csv"
# df = spark.read.csv(csv_file_path, header=True, inferSchema=True)
# df.write.format("starrocks_writer").mode("append").options(**options).save()
