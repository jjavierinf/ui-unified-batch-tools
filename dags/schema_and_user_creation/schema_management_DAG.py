
from airflow import DAG
from airflow.operators.mysql_operator import MySqlOperator
from datetime import timedelta
import pendulum
from saga.notifiers.on_dag_failure_notifier.on_dag_failure_notifier import OnDagFailureNotifier


# Define default arguments for the DAG
default_args = {
    "owner": "a.kwiek", # MM user
    "start_date": '2000-01-01',
    "catchup": False, # If True will make a backfill from last success date (if there is no sd then start date) to current date
    "retries": 5,
    "retry_delay": timedelta(minutes=1),
}

# Create a DAG instance
dag = DAG(
    "db_administration",
    default_args=default_args,
    description="This DAG manages all schema creation (besides from tables which are created at the DAG level) and users and roles administration",
    template_searchpath = "/opt/airflow/data/dags/repo/schema_and_user_creation/sql_files/", # Container path where sql scripts are going to be located at
    max_active_runs=1,
    max_active_tasks=3,
    schedule_interval="0,15,30,45 * * * *", # Schedule interval using CRONTAB
    tags=["db_management", "roles", "schema"], # Team and BU
    on_failure_callback=OnDagFailureNotifier(),
)


with dag:

    schemas = MySqlOperator(
        task_id="create_schemas",
        sql="schema_creation/schemas.sql",
        mysql_conn_id = "starrocks_connection",
    )

    da = MySqlOperator(
        task_id="create_data_analyst_role",
        sql="users_and_roles/data_analyst.sql",
        mysql_conn_id = "starrocks_connection",
    )

    de = MySqlOperator(
        task_id="create_data_engineer_role",
        sql="users_and_roles/data_engineer.sql",
        mysql_conn_id = "starrocks_connection",
    )

    # Define the task dependencies
    schemas >> [da, de]
