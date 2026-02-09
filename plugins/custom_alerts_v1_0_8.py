from airflow.models import Variable
from airflow.models import TaskInstance
from airflow.settings import Session
import requests

webhookURL = Variable.get("mattermost_webhook", default_var=None)
airflow_host_base_address = Variable.get("airflow_host_base_address", default_var=None)

def send_webhook_alert(context):
    try:
        dag_run = context['dag_run']
        
        if dag_run.state == 'failed':

            if skipAlert(dag_run):
                return

            dag = context['dag']
            dag_id = dag.dag_id

            # Because an Airflow bug we can't use task_instance, 
            # it's returning previous success task
            # so we query the last failed task
            failed_task_instance = (
                Session.query(TaskInstance)
                .filter(TaskInstance.dag_id == dag_id, 
                        TaskInstance.start_date >= dag_run.execution_date,
                        TaskInstance.state == 'failed')
                .order_by(TaskInstance.start_date.desc())
                .first()
            )     

            dag_tags = dag.tags or "No tags"
   
            log_url = failed_task_instance.log_url.replace("localhost:8080", airflow_host_base_address)
       
            message = (
                f":siren: **DAG '{dag_id}' failed** :siren:\n"
                f"**Integration: {dag_tags}**\n"
                f"**Execution date:** {failed_task_instance.start_date}\n"
                f"**Owner: @{dag.owner}**\n"
                f"Task: '{failed_task_instance.task_id}'\n"
                f"Task end date: {failed_task_instance.end_date}\n"
                f"**[View log :clipboard:]({log_url})**"
            ) 

            print(message)           
            print(f"Posting to webhook URL!: {webhookURL}")
            requests.post(webhookURL, json={"text": message}, verify=False)
    
    except Exception as e:
        print(f"An error occurred: {str(e)}")

def skipAlert(dag_run):
    prev_dag_run = dag_run.get_previous_dagrun()
    if (prev_dag_run is None
        or (dag_run.execution_date.hour == prev_dag_run.execution_date.hour
        and dag_run.execution_date.day == prev_dag_run.execution_date.day)
        ):
        print(f"Alert skipped! Current run: {dag_run.execution_date} - Previous run: {prev_dag_run.execution_date}") 
        return True
    else:
        return False
    
def send_message(message):
    print(message)
    print(f"Posting to webhook URL!: {webhookURL}")
    airflow_host_base_address = Variable.get("airflow_host_base_address", default_var=None)
    message = message.replace("localhost:8080", airflow_host_base_address)
    print(message)

    response = requests.post(webhookURL, json={"text": message}, verify=False)

    if response.status_code != 200:
        print(f"Failed to send message: {response.text}")
