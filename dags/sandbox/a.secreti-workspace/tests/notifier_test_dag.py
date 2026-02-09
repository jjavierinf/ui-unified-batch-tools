from datetime import datetime
from airflow import DAG
from airflow.operators.python import PythonOperator
from notifications.message_notifier import MessageNotifier
from notifications.on_dag_failure_notifier import OnDagFailureNotifier

def successful_task():
    print("Task executed successfully!")

def failing_task():
    print("This is an error message!")
    print("this is a ConnectionTimeout message!")
    print("This is another type of error message!")  
    print("This is a repeated timeout message! If you don't see this message more than once we are fine!")
    print("This is a repeated timeout message! If you don't see this message more than once we are fine!")
    print("This is a repeated timeout message! If you don't see this message more than once we are fine!")
    print("Exception - this is an exception message!")
    for i in range(1, 11):
        print(f"This is another error line {i}")
    raise Exception("This task has failed!")

def other_successful_task():
    print("Other Task executed successfully!")

default_args = {
    'owner': 'a.secreti',
    'start_date': datetime(2024, 9, 24),
    'retries': 0,
}

with DAG('notifier_test_dag',
    default_args=default_args,
    schedule_interval="0 0 * * *",            
    on_failure_callback=[MessageNotifier("This is a MessageNotifier test message!"), OnDagFailureNotifier()],
    catchup=False,
    tags=['TeamData']
) as dag:

    task1 = PythonOperator(
        task_id='successful_task',
        python_callable=successful_task
    )

    task2 = PythonOperator(
        task_id='failing_task',
        python_callable=failing_task
    )

    task3 = PythonOperator(
        task_id='other_successful_task',
        python_callable=other_successful_task
    )

    task1 >> task2 >> task3