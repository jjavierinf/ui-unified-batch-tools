from airflow.providers.apache.spark.operators.spark_submit import \
    SparkSubmitOperator

import yaml
from convert_tz import convert_utc_to_et
import re 
import os


def SourceToStarrocksOperator_DEVELOP(dag, task_id, config_path, job_name):

    def extract_columns_from_sql(sql_file_path):
        try:
            with open(sql_file_path, 'r') as file:
                sql_content = file.read()
                
                # Use regular expressions to find the column definitions within parentheses
                column_pattern = re.compile(r'\((.*?)\)', re.DOTALL)
                column_match = column_pattern.search(sql_content)
                
                if column_match:
                    column_text = column_match.group(1)
                    
                    # Split the text by commas and strip any leading/trailing whitespace
                    columns_and_types = [column.strip() for column in column_text.split(',')]
                    
                    # Extract only the column names (the first part before the first space)
                    columns = [column.split()[0] for column in columns_and_types]
                    return columns
                else:
                    return []
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            return []

    def read_spark_config(yaml_path, job_name):
        # Load Spark job configuration from YAML file
        with open(yaml_path, "r") as config_file:
            spark_config = yaml.safe_load(config_file)

        if job_name in spark_config:
            job_params = spark_config[job_name]
            
            # Initialize the spark_params dictionary
            spark_params = {}

            # Parse SQL Server parameters
            sql_server_params = job_params.get('sql_server', {})
            for key, value in sql_server_params.items():
                spark_params[f"spark.sql_server.{key}"] = value

            # Parse Starrocks parameters
            starrocks_params = job_params.get('starrocks', {})
            for key, value in starrocks_params.items():
                spark_params[f"spark.starrocks.{key}"] = value

            # Parse Spark parameters
            # TODO: set limits or warnings to memory usage
            spark_params_config = job_params.get('spark', {})
            for key, value in spark_params_config.items():
                spark_params[f"spark.{key}"] = value

            # Join JAR file paths into a comma-separated string
            spark_params['spark.jars'] = ",".join(spark_params_config.get('jars', []))
            
            # Check if an 'sql_create_table' path is provided under starrocks
            sql_create_table_path = starrocks_params.get('sql_create_table', None)
            if sql_create_table_path and os.path.isfile(sql_create_table_path):
                # Extract column names from the SQL file
                columns = extract_columns_from_sql(sql_create_table_path)
                if columns:
                    # Override the 'spark.starrocks.columns' parameter
                    spark_params['spark.starrocks.columns'] = ",".join(columns)

            return spark_params

    config = read_spark_config(config_path, job_name)

    dag.user_defined_filters = {'convert_utc_to_et': convert_utc_to_et}

    task = SparkSubmitOperator(
        task_id=task_id,
        conn_id="spark_default",
        # TODO: this should come from the yaml too
        # to allow other jobs to be used
        application="/opt/airflow/data/plugins/develop/spark_sql_server_to_starrocks_DEVELOP/pyspark/source_to_starrocks_job_DEVELOP.py",
        jars=config['spark.jars'],
        name="submit_to_spark",
        executor_cores=config['spark.executor_cores'],
        executor_memory=config['spark.executor_memory'],
        driver_memory=config['spark.driver_memory'],
        num_executors=config['spark.num_executors'],
        total_executor_cores = config['spark.total_executor_cores'],
        verbose=True,
        application_args = ['{{ ts | convert_utc_to_et }}',task_id],
        conf=config,
        dag=dag
    )

    return task

