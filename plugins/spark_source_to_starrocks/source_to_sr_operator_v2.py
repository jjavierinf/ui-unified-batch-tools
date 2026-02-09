import sys
import os
import yaml
import re
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.models import Variable
from airflow.operators.python_operator import PythonOperator
from convert_tz import convert_utc_to_et 
sys.path.append("/opt/airflow/data/plugins")
from python_load_to_starrocks_v2 import execute_etl
import json


def extract_columns_from_sql(sql_file_path):
    try:
        with open(sql_file_path, 'r') as file:
            sql_content = file.read()

        column_pattern = re.compile(r'\((.*?)\)', re.DOTALL)
        column_match = column_pattern.search(sql_content)
        if column_match:
            column_text = column_match.group(1)
            columns_and_types = [column.strip() for column in column_text.split(',')]
            columns = [re.sub(r'`', '', column.split()[0]) for column in columns_and_types]            
            return columns
        else:
            return []
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return []




def read_config(yaml_path):
    # yaml_path =f"/opt/airflow/data/dags/repo/dynamic_test/CreditCardTransactions/conf.yaml"
    try:
        with open(yaml_path, "r") as config_file:
            yaml_config = yaml.safe_load(config_file)
        return yaml_config
    except Exception as e:
        print(yaml_path)
        raise e


def create_spark_operator(task_id, config, dag, app, cores, executor_memory='2g', driver_memory='6g'):
    return SparkSubmitOperator(
        task_id=task_id,
        conn_id="spark_default",
        application=f"/opt/airflow/data/plugins/spark_source_to_starrocks/pyspark/{app}",
        jars="/opt/bitnami/jars/starrocks-spark-connector-3.4_2.12-1.1.1.jar,/opt/bitnami/jars/mysql-connector-java-8.0.30.jar,/opt/bitnami/jars/mssql-jdbc-9.2.1.jre8.jar,/opt/bitnami/jars/postgresql-42.6.0.jar",
        name="submit_to_spark",
        executor_cores=1,
        total_executor_cores=cores,
        executor_memory=executor_memory,
        driver_memory=driver_memory,
        # num_executors=cores,
        verbose=True,
        application_args=['{{ ts | convert_utc_to_et }}', task_id, json.dumps(config)],
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



def SourceToStarrocksOperator_v2(dag, task_id, config_path,create_table_stage_sql_path):
    config = read_config(config_path)
    source_conn = config['source']['conn']
    # target_conn = config['target']['conn']
    config['target']['conn_dict'] = Variable.get('starrocks_conn')
    config['source']['conn_dict'] = Variable.get(source_conn)
    config['target']['columns'] = extract_columns_from_sql(create_table_stage_sql_path)

    expected_workload = config['expected_workload']    
    dag_type = config['dag_type']
    # config[f'{job_type}.starrocks.conn'] = Variable.get('starrocks_conn')
    dag.user_defined_filters = {'convert_utc_to_et': convert_utc_to_et}
    
    task_id = f"{task_id}_{dag_type}_{expected_workload}"
    if expected_workload == 'low':
        return create_python_operator(task_id, config, dag)
    elif expected_workload == 'medium':
        return create_spark_operator(task_id, config, dag,'source_to_starrocks_job_paralel_v2.py', 2)
    elif expected_workload == 'high':
        return create_spark_operator(task_id, config, dag,'source_to_starrocks_job_paralel_v2.py', 4)
    elif expected_workload == 'ultra-high':
        return create_spark_operator(task_id, config, dag,'source_to_starrocks_job_paralel_v2_ultra.py', 4, "4g", "6g")
    else:
        raise ValueError(f"Unsupported expected_workload: {expected_workload}. Only 'low', 'medium', 'high' and 'ultra-high' are allowed.")
    
