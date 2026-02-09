# Using SourceToStarrocksOperator

The `SourceToStarrocksOperator` is a custom Apache Airflow operator designed to facilitate the execution of Spark jobs that transfer data from SQL Server to Starrocks . This guide will explain how to use the operator, set up the necessary YAML configuration, and provide examples.


## How to Use the Operator

### Step 1: Import the Operator

Import the `SourceToStarrocksOperator` into your Airflow DAG file.

```python
from SourceToStarrocksOperator import SourceToStarrocksOperator
```

### Step 2: Create the Operator

Create an instance of the `SourceToStarrocksOperator` within your DAG, specifying the required parameters.

```python
load_crm_customer_today_task = SourceToStarrocksOperator(
    dag=dag,
    task_id="extract_and_load_crm_customer_today",
    config_path="/path/to/spark_config.yaml",
    job_name="customer_spark_job"
)
```

### Step 3: YAML Configuration

Prepare a YAML configuration file (`spark_config.yaml`) containing parameters for your Spark job. The configuration should have the following structure:

```yaml
customer_spark_job:
  sql_server:
    host: host
    db: db
    user: user
    password: password
    schema: schema
    table: origin_table
  starrocks:
    database: db_stage
    table: target_table
spark:
    executor_cores: 1
    executor_memory: 2g
    driver_memory: 16g
    num_executors: 5
    total_executor_cores: 4
    jars:
      - /opt/bitnami/jars/starrocks-spark-connector-3.4_2.12-1.1.1.jar
      - /opt/bitnami/jars/mysql-connector-java-8.0.30.jar
      - /opt/bitnami/jars/mssql-jdbc-9.2.1.jre8.jar
    num_splits: 30  
    max_retries: 4 
    retry_delay: 30 
    query_mode: incremental  
    incremental_field: rowModified
    lookback_minutes: 30 

```



### Step 4: Airflow DAG

Integrate the operator into your Airflow DAG by setting up the task dependencies.

```python
load_crm_customer_today_task >> other_tasks
```

## Example DAG

That's it! You've successfully integrated the `SourceToStarrocksOperator` into your Airflow DAG to run Spark jobs for SQL Server to Starrocks data transfer.
