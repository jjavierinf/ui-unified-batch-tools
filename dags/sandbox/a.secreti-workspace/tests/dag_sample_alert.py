from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
from custom_alerts_v1_0_9 import send_webhook_alert

def successful_task():
    print("Task executed successfully!")

def failing_task():
    print("Task will fail now...")
    raise Exception("This task has failed!")

def other_successful_task():
    print("Other Task executed successfully!")

default_args = {
    'owner': 'a.secreti',
    'start_date': datetime(2023, 11, 3),
    'retries': 0,
}

dag = DAG('dag_sample_alert',
          default_args=default_args,
          schedule_interval=None,  
          on_failure_callback=send_webhook_alert,
          catchup=False,
          tags=['integration_name', 'type']
          )

task1 = PythonOperator(
    task_id='successful_task',
    python_callable=successful_task,
    dag=dag,
)

task2 = PythonOperator(
    task_id='failing_task',
    python_callable=failing_task,
    dag=dag,
)

task3 = PythonOperator(
    task_id='other_successful_task',
    python_callable=other_successful_task,
    dag=dag,
)

task1 >> task2 >> task3