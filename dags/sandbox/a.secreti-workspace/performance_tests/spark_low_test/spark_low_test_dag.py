import os
from airflow.models import DAG
from airflow.operators.mysql_operator import MySqlOperator
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from datetime import datetime, timedelta
from airflow.models import Variable

# connections
postgres = Variable.get("postgres_production_conn")
starrocks_conn = Variable.get("starrocks_conn")

current_dir = os.path.dirname(os.path.abspath(__file__))
conf_yaml_path = os.path.join(current_dir, 'conf.yaml')
sql_path = os.path.join(current_dir, 'sql_files')
create_table_stage_sql_path = os.path.join(sql_path, 'create_table_stage.sql')

args = {
    "owner": "a.secreti",
    "depends_on_past": False,
    "retries": 3,
    "retry_delay": timedelta(minutes=10)
}

with DAG(
    dag_id="spark_low_test_dag",
    default_args=args,
    schedule="0 9 * * *",
    max_active_runs=1,
    start_date=datetime(2024, 4, 17),
    template_searchpath="/opt/airflow/data/dags/repo/sandbox/a.secreti-workspace/performance_tests/spark_low_test/sql_files/",
    tags=["TEST"],
) as dag:
    
    create_table_stage = MySqlOperator(
        task_id="create_table_stage",
        sql="create_table_stage.sql",
        mysql_conn_id="starrocks_connection",
    )
   
    spark_submit_job = SparkSubmitOperator(
        task_id="extract_and_load",
        conn_id="spark_default",
        application="/opt/airflow/data/dags/repo/sandbox/a.secreti-workspace/performance_tests/spark_low_test/spark/consumer_job.py",
        packages="mysql:mysql-connector-java:8.0.33,com.starrocks:starrocks-spark-connector-3.4_2.12:1.1.2,org.postgresql:postgresql:42.2.19",
        verbose=False,
        executor_cores=1,
        executor_memory="512m",
        driver_memory="512m",
        num_executors=1,
        total_executor_cores=1,
        application_args=[postgres, starrocks_conn],
    )

create_table_stage >> spark_submit_job
