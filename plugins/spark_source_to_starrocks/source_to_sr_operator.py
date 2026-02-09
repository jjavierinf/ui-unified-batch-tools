import sys
import os
import yaml
import re
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.models import Variable
from airflow.operators.python_operator import PythonOperator
from convert_tz import convert_utc_to_et 
sys.path.append("/opt/airflow/data/plugins")
from python_load_to_starrocks import execute_etl


def extract_columns_from_sql(sql_file_path):
    try:
        with open(sql_file_path, 'r') as file:
            sql_content = file.read()

        column_pattern = re.compile(r'\((.*?)\)', re.DOTALL)
        column_match = column_pattern.search(sql_content)
        if column_match:
            column_text = column_match.group(1)
            columns_and_types = [column.strip() for column in column_text.split(',')]
            columns = [column.split()[0] for column in columns_and_types]
            return columns
        else:
            return []
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return []


def parse_params(params, prefix, spark_params):
    for key, value in params.items():
        spark_params[f"{prefix}.{key}"] = value
    return spark_params



def read_config(yaml_path, job_name, source_conn_type):
    with open(yaml_path, "r") as config_file:
        yaml_config = yaml.safe_load(config_file)

    if job_name not in yaml_config:
        raise ValueError(f"Job name : {job_name} not found in yaml_config.yaml, please review the job keys")

    job_params = yaml_config[job_name]
    job_type = job_params.get('type', 'spark')  # Default to 'spark' if 'type' key is missing

    spark_params = {}
    if source_conn_type:
        if source_conn_type not in ['postgres', 'sql_server']:
            raise ValueError("source_conn_type configuration can only contain 'postgres' or 'sql_server' values.")
        spark_params[F'{job_type}.source'] = source_conn_type

    parse_params(job_params.get('sql_server', {}), F"{job_type}.sql_server", spark_params)
    parse_params(job_params.get('postgres', {}), F"{job_type}.postgres", spark_params)
    parse_params(job_params.get('starrocks', {}), F"{job_type}.starrocks", spark_params)

    spark_params_config = job_params.get(F'{job_type}', {})
    parse_params(spark_params_config, F"{job_type}", spark_params)
    spark_params[F'{job_type}.jars'] = ",".join(spark_params_config.get('jars', []))

    # parse create table file
    sql_create_table_path = job_params.get('starrocks', {}).get('sql_create_table', None)
    if sql_create_table_path:
        columns = extract_columns_from_sql(sql_create_table_path)
        if columns:
            spark_params[f'{job_type}.starrocks.columns'] = ",".join(columns)

    return spark_params, job_type


def create_spark_operator(task_id, config, dag):
    return SparkSubmitOperator(
        task_id=f"{task_id}_spark",
        conn_id="spark_default",
        application=f"/opt/airflow/data/plugins/spark_source_to_starrocks/pyspark/{config.get('spark.app', 'source_to_starrocks_job_paralel.py')}",
        jars=config['spark.jars'],
        name="submit_to_spark",
        executor_cores=config['spark.executor_cores'],
        executor_memory=config['spark.executor_memory'],
        driver_memory=config['spark.driver_memory'],
        num_executors=config['spark.num_executors'],
        total_executor_cores=config.get('spark.total_executor_cores',None),
        verbose=True,
        application_args=['{{ ts | convert_utc_to_et }}', task_id, ],
        conf=config,
        dag=dag
    )


def create_python_operator(task_id, config, dag):
    return PythonOperator(
        task_id=f"{task_id}_python",
        python_callable=execute_etl,
        op_args=['{{ ts | convert_utc_to_et }}', '{{ task_instance.task_id }}'],
        op_kwargs={'conf': config},
        dag=dag
    )



def SourceToStarrocksOperator(dag, task_id, config_path, job_name, source_conn_type=None, source_conn=None):
    config, job_type = read_config(config_path, job_name, source_conn_type)
    config[f'{job_type}.starrocks.conn'] = Variable.get('starrocks_conn')
    config[f'{job_type}.{config[f"{job_type}.source"]}.conn'] = Variable.get(source_conn)
    dag.user_defined_filters = {'convert_utc_to_et': convert_utc_to_et}

    if job_type == 'python':
        return create_python_operator(task_id, config, dag)
    elif job_type == 'spark':
        return create_spark_operator(task_id, config, dag)
    else:
        raise ValueError(f"Unsupported job_type: {job_type}. Only 'python' and 'spark' are allowed.")