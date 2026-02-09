import pendulum
from datetime import timedelta
from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.operators.mysql_operator import MySqlOperator
from spark_source_to_starrocks.source_to_sr_operator import SourceToStarrocksOperator

from convert_tz import convert_utc_to_et

# Define default arguments for the DAG
default_args = {
    "owner": "a.kwiek", # MM user
    "start_date": pendulum.datetime(2017, 1, 1, tz="US/Eastern"),
    "catchup": False, # If True will make a backfill from last success date (if there is no sd then start date) to current date
    "retries": 3,
    "retry_delay": timedelta(minutes=1), #TODO apply report on failure logic
}

# Create a DAG instance
dag = DAG(
    "flow_sample",
    default_args=default_args,
    description="A simple dag to show sample DAG flow",
    template_searchpath = "/opt/airflow/data/dags/repo/sandbox/examples/sample_dag/sql_files/", # Container path where sql scripts are going to be located at
    max_active_runs=1,
    max_active_tasks=3,
    schedule_interval="0 0 * * *", # Schedule interval using CRONTAB
    tags=["MKT", "BOCATO", "example_integration","work_in_progress", "backfill_ready"], # BU, team and integration name
)

# Register the custom filter
dag.user_defined_filters = {'convert_utc_to_et': convert_utc_to_et}


with dag:

    raw = MySqlOperator(
        task_id="create_table_stage",
        sql="schema_creation/stage_schema.sql",
        mysql_conn_id = "starrocks_connection",
    )

    dm = MySqlOperator(
        task_id="create_table_dm",
        sql="schema_creation/dm_schema.sql",
        mysql_conn_id = "starrocks_connection",
    )

    bm = MySqlOperator(
        task_id="create_table_bm",
        sql="schema_creation/bm_schema.sql",
        mysql_conn_id = "starrocks_connection",
    )    

    spark_load_sqlserver = SourceToStarrocksOperator(
        dag=dag,
        task_id="spark_load_customer_detail_raw",
        config_path="/opt/airflow/data/dags/repo/sandbox/examples/sample_dag/spark_config.yaml",
        # job_name="sample_spark_job"
        job_name="sample_spark_job",
        source_conn_type = 'postgres',
        source_conn = 'postgres_production_conn'
    )    
    
    spark_load_postgres = SourceToStarrocksOperator(
        dag=dag,
        task_id="sample_from_postgres_job",
        config_path="/opt/airflow/data/dags/repo/sandbox/examples/sample_dag/spark_config.yaml",
        # job_name="sample_spark_job"
        job_name="sample_from_postgres_job",    
        source_conn_type = 'postgres',
        source_conn = 'postgres_production_conn'
    )


    cast = MySqlOperator(
        task_id="stage_to_data_model",
        sql="transformations/stage_to_data_model.sql",
        mysql_conn_id = "starrocks_connection",
    )

    agg = MySqlOperator(
        task_id="data_model_to_business_model",
        sql="transformations/data_model_to_business_model.sql",
        mysql_conn_id = "starrocks_connection",
    )   

    bash_task = BashOperator(
        task_id="example_for_passing_date_as_hyperparameter",
        bash_command="echo '{{ ts | convert_utc_to_et }}'",
    )

    rdm_insert = MySqlOperator(
        task_id="conditioned_query_with_templeting",
        sql="transformations/query_using_templeting.sql",
        mysql_conn_id = "starrocks_connection",
    )  

    # Define the task dependencies
    [raw, dm, bm] >> spark_load_sqlserver >> cast >> agg >> [bash_task, rdm_insert]
    [raw, dm, bm] >> spark_load_postgres