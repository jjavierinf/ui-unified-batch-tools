import os
from airflow.models import DAG
from airflow.operators.mysql_operator import MySqlOperator
from airflow.providers.cncf.kubernetes.operators.pod import KubernetesPodOperator
from datetime import datetime, timedelta
from airflow.models import Variable

# connections
postgres_conn = Variable.get("postgres_production_conn")
sqlserver_BI_conn = Variable.get("sqlserver_BI_conn_bak")
mysql_myaffilates_conn = Variable.get("mysql_myaffiliates_conn")
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
    dag_id="k8s_pod_test_dag",
    default_args=args,
    schedule="0 9 * * *",
    max_active_runs=1,
    start_date=datetime(2024, 4, 25),
    template_searchpath="/opt/airflow/data/dags/repo/sandbox/a.secreti-workspace/performance_tests/k8s_pod_test/sql_files/",
    tags=["TEST"],
) as dag:
    
    create_table_stage_1 = MySqlOperator(
        task_id="create_table_stage_1",
        sql="create_table_stage_1.sql",
        mysql_conn_id="starrocks_connection",
    )

    create_table_stage_2 = MySqlOperator(
        task_id="create_table_stage_2",
        sql="create_table_stage_2.sql",
        mysql_conn_id="starrocks_connection",
    )

    create_table_stage_3 = MySqlOperator(
        task_id="create_table_stage_3",
        sql="create_table_stage_3.sql",
        mysql_conn_id="starrocks_connection",
    )
   
    postgres_test = KubernetesPodOperator(
        task_id="postgres_test",
        name="postgres_test",
        namespace='airflow',
        image='nexus.itspty.com:5000/saga/saga_consumer_job:1.0.0-alpha11',
        image_pull_policy='IfNotPresent',
        cmds=['python', 'consumer_job.py'],
        arguments=[
              'postgresql+psycopg2',
              postgres_conn, 
              'SELECT * FROM production.chat.form_submission_select_options',
              starrocks_conn,  
              'db_stage_DEVELOP',
              'k8s_pod_test_1', 
              '{{ ts }}', 
              'True'
              ], 
        is_delete_operator_pod=True,
        get_logs=True
    )

    sqlserver_test = KubernetesPodOperator(
        task_id="sqlserver_test",
        name="sqlserver_test",
        namespace='airflow',
        image='nexus.itspty.com:5000/saga/saga_consumer_job:1.0.0-alpha11',
        image_pull_policy='IfNotPresent',
        cmds=['python', 'consumer_job.py'],
        arguments=[
              'mssql+pyodbc',
              sqlserver_BI_conn, 
              'SELECT * FROM interface.Brand',
              starrocks_conn,  
              'db_stage_DEVELOP',
              'k8s_pod_test_2', 
              '{{ ts }}', 
              'True'
              ], 
        is_delete_operator_pod=True,
        get_logs=True
    )

    mysql_test = KubernetesPodOperator(
        task_id="mysql_test",
        name="mysql_test",
        namespace='airflow',
        image='nexus.itspty.com:5000/saga/saga_consumer_job:1.0.0-alpha11',
        image_pull_policy='IfNotPresent',
        cmds=['python', 'consumer_job.py'],
        arguments=[
              'mysql+mysqlconnector',
              mysql_myaffilates_conn, 
              'SELECT * FROM ma_reward_types',
              starrocks_conn,  
              'db_stage_DEVELOP',
              'k8s_pod_test_3', 
              '{{ ts }}', 
              'True'
              ], 
        is_delete_operator_pod=True,
        get_logs=True
    )

[create_table_stage_1, create_table_stage_2, create_table_stage_3] >> postgres_test
postgres_test >> sqlserver_test >> mysql_test
