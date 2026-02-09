import yaml
from airflow import DAG
from airflow.operators.mysql_operator import MySqlOperator
from datetime import timedelta, datetime
import pytz
import os
from spark_source_to_starrocks.source_to_sr_operator_v2 import SourceToStarrocksOperator_v2
from convert_tz import convert_utc_to_et, convert_utc_to_utc

# Find the current directory of the Python file
current_dir = os.path.dirname(os.path.abspath(__file__))
conf_yaml_path = os.path.join(current_dir, 'conf.yaml')
sql_path = os.path.join(current_dir, 'sql_files')
create_table_stage_sql_path = os.path.join(sql_path, 'create_table_stage.sql')

# Check if conf.yaml exists
if not os.path.exists(conf_yaml_path):
    raise Exception(f"conf.yaml not found in {current_dir}. Please make sure the file exists.")
# Load configuration from conf.yaml
with open(conf_yaml_path, 'r') as conf_file:
    conf = yaml.safe_load(conf_file)

base_start_date = conf['dag_config']['dag_start_date']
source_timezone = pytz.timezone(conf['source']['source_timezone'])
dag_start_date_tz = source_timezone.localize(datetime.fromisoformat(base_start_date))

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
    template_searchpath = sql_path,
)

dag.user_defined_filters = {'convert_utc_to_et': convert_utc_to_et}
dag.user_defined_filters = {'convert_utc_to_utc': convert_utc_to_utc}

create_table_stage_task = MySqlOperator(
    task_id="create_table_stage",
    sql="create_table_stage.sql",
    mysql_conn_id="starrocks_connection",
    dag=dag)


extract_and_load_task = SourceToStarrocksOperator_v2(
    dag,
    task_id="extract_and_load",
    config_path=conf_yaml_path,
    create_table_stage_sql_path=create_table_stage_sql_path
)

create_table_stage_task >> extract_and_load_task