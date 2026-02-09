import os
from datetime import timedelta
import pendulum
from airflow import DAG
from airflow.operators.mysql_operator import MySqlOperator
from saga.core.utils.globalization import convert_utc_to_et
from saga.operators.saga_elt_operator.saga_elt_operator import SagaELTOperator
from saga.notifiers.on_dag_failure_notifier.on_dag_failure_notifier import OnDagFailureNotifier

current_dir = os.path.dirname(os.path.abspath(__file__))

default_args = {
    "owner": "j.rey",
    "depends_on_past": False,
    "retries": 3,
    "retry_delay": timedelta(minutes=10)
}

with DAG(
    dag_id="sqlserver_gamingintegration_tr_dailytransactionamount",
    default_args=default_args,
    description="DAG to replicate GamingIntegration DailyTransactionAmount for Sportsbook.",
    schedule_interval="*/5 * * * *",
    start_date=pendulum.parse("2025-05-18T00:00:00", tz="US/Eastern"),
    catchup=False,
    max_active_runs=3,
    max_active_tasks=2,
    tags=[
        "SystemOfOrigin:Sportsbook",
        "TypeOfDag:Incremental",                   
        "Source:Sqlserver",
        "Table:tr.DailyTransactionAmount",
        "Target:Starrocks",
        "Team:DataTeam",
        "Project:GamingIntegration",
        "Frequency:BatchingHighFrequency",
        "TemplateVersion:1.0.10",           
        "Complexity:ELT"
    ],
    template_searchpath=os.path.join(current_dir, "sql_files"),
    on_failure_callback=OnDagFailureNotifier()
) as dag:

    dag.user_defined_filters = { "convert_utc_to_et": convert_utc_to_et }

    create_table_stage = MySqlOperator(
        task_id="create_table_stage",
        sql="ddl/create_table_stage.sql",
        mysql_conn_id = "starrocks_connection"
    )

    create_table_data_model = MySqlOperator(
        task_id="create_table_data_model",
        sql="ddl/create_table_data_model.sql",
        mysql_conn_id = "starrocks_connection"        
    )

    saga_elt_operator_job = SagaELTOperator(   
       task_id="saga_elt_operator_job",    
       elt_config_path=os.path.join(current_dir, "elt_config.yaml")
    )

    stage_to_data_model = MySqlOperator(
        task_id="stage_to_data_model",
        sql="dml/stage_to_data_model.sql",
        mysql_conn_id="starrocks_connection"
    )

    delete_stage_old_records = MySqlOperator(
        task_id="delete_stage_old_records",
        sql="dml/delete_stage_old_records.sql",
        mysql_conn_id = "starrocks_connection"
    )

    (
    [create_table_stage, create_table_data_model]
    >> saga_elt_operator_job
    >> stage_to_data_model
    >> delete_stage_old_records
    )