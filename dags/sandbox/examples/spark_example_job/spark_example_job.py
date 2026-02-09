from airflow.models import DAG
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.utils.dates import days_ago

args = {
    'owner': 'airflow',
}

with DAG(
    dag_id='spark_submit_job',
    default_args=args,
    schedule_interval=None,
    start_date=days_ago(2),
    tags=['example'],
) as dag:

    submit_job = SparkSubmitOperator(
        task_id='spark_submit_job',
        conn_id='spark_default',
        application='/mnt/data/test_spark_script.py', # the path to your Spark job file
        name='airflow-spark-example',
        verbose=False,
    )

    submit_job

# spark-submit --master spark://spark-master-0.spark-headless.spark.svc.cluster.local:7077 --conf spark.jars.ivy=/tmp/.ivy /mnt/data/test_spark_script.py