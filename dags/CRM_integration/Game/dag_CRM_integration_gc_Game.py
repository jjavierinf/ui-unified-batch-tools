from datetime import timedelta
import sys 
sys.path.append("/opt/airflow/data/plugins")
from airflow import DAG
from airflow.operators.mysql_operator import MySqlOperator
from spark_source_to_starrocks.source_to_sr_operator_v2 import SourceToStarrocksOperator_v2
from custom_alerts_v1_0_9 import send_webhook_alert
from convert_tz import convert_utc_to_et, convert_utc_to_utc
from common_utilities import get_config_and_paths

import os 

# Find the current directory of the Python file
current_dir = os.path.dirname(os.path.abspath(__file__))

conf, current_dir, sql_path, create_table_stage_sql_path, dag_start_date_tz, conf_yaml_path = get_config_and_paths(current_dir)


default_args = {
    "owner": conf['dag_config']['dag_owner'],
    "depends_on_past": False,
    "start_date": dag_start_date_tz,
    "retries": 3,
    "retry_delay": timedelta(minutes=10)
}

dag = DAG(
    conf['dag_config']['dag_name'],
    default_args=default_args,
    description=conf['dag_config']['dag_description'],
    schedule_interval=conf['dag_config']['dag_schedule_interval'],
    catchup=conf['dag_config']['dag_catchup'],
    max_active_runs=conf['dag_config']['dag_max_active_runs'],
    tags=conf['dag_config']['dag_tags'],
    on_failure_callback=send_webhook_alert,
    template_searchpath = sql_path
)

dag.user_defined_filters = {'convert_utc_to_et': convert_utc_to_et}
dag.user_defined_filters = {'convert_utc_to_utc': convert_utc_to_utc}

create_table_stage_task = MySqlOperator(
        task_id="create_table_stage",
        sql="ddl/create_table_stage.sql",
        mysql_conn_id = "starrocks_connection",
        dag=dag)

create_table_data_model_task = MySqlOperator(
        task_id="create_table_data_model",
        sql="ddl/create_table_data_model.sql",
        mysql_conn_id = "starrocks_connection",
        dag=dag)

extract_and_load_task = SourceToStarrocksOperator_v2(
    dag,
    task_id="extract_and_load",
    config_path=conf_yaml_path,
    create_table_stage_sql_path=create_table_stage_sql_path
)

data_model_task = MySqlOperator(
    task_id="data_model_task",
    sql="transformations/data_model_task.sql",
    mysql_conn_id="starrocks_connection",
    dag=dag)


delete_old_logs = MySqlOperator(
        task_id="delete_old_logs",
        sql="transformations/delete_logs.sql",
        mysql_conn_id = "starrocks_connection",
        dag=dag)

create_table_stage_task >> extract_and_load_task
create_table_data_model_task >> extract_and_load_task
extract_and_load_task >> data_model_task >> delete_old_logs