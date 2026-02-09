from airflow.models import Variable, DagRun, TaskInstance
from airflow.settings import Session
import requests
import logging
from datetime import datetime, timedelta
from airflow.utils.timezone import utcnow

webhookURL = Variable.get("mattermost_webhook", default_var=None)
airflow_host_base_address = Variable.get("airflow_host_base_address", default_var=None)

def send_webhook_alert(context):
    logging.info("=== send_webhook_alert started ===")
    try:
        dag_run = context['dag_run']
        logging.info(f"Processing alert for DAG: {dag_run.dag_id}")
        logging.info(f"Current DAG state: {dag_run.state}")
        
        # Assume failed if hook is triggered
        logging.info("DAG state is considered failed since hook was triggered, checking if should skip...")
        
        if skipAlert(dag_run):
            logging.info("Alert was skipped")
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
        logging.error(f"Error in send_webhook_alert: {str(e)}")
        raise e

def skipAlert(dag_run):
    logging.info(f"=== Starting skipAlert check for dag_run: {dag_run.dag_id} ===")
    
    # Check if DAG is continuous
    dag = dag_run.dag
    if not dag.schedule_interval or '@continuous' not in str(dag.schedule_interval):
        logging.info("DAG is not continuous - Not skipping alert")
        return False
        
    prev_dag_run = dag_run.get_previous_dagrun()
    
    if prev_dag_run is None:
        logging.info("No previous dag run found - Not skipping alert")
        return False
    
    logging.info(f"Previous dag run found with state: {prev_dag_run.state}")
        
    three_hours_ago = utcnow() - timedelta(hours=3)

    # Using 2 instead of 3 because current dag will be failing but current dag run is not 
    # included as it's not finished yet (it's still running)
    recent_runs = (
        Session.query(DagRun)
        .filter(
            DagRun.dag_id == dag_run.dag_id,
            DagRun.execution_date <= dag_run.execution_date,
            DagRun.execution_date >= three_hours_ago,
            DagRun.state == 'failed'
        )
        .order_by(DagRun.execution_date.desc())
        .limit(2)
        .all()
    )
    
    logging.info(f"Found {len(recent_runs)} recent failed runs in last 3 hours")
    for i, run in enumerate(recent_runs):
        logging.info(f"Run {i+1} - Date: {run.execution_date}, State: {run.state}, ID: {run.run_id}")
    
    if len(recent_runs) == 3:
        logging.info("Alert will be sent - 3 failures in last 3 hours detected!")
        return False
        
    logging.info(f"Alert skipped! Not enough failures in last 3 hours")
    return True
    
def send_message(message):
    print(message)
    print(f"Posting to webhook URL!: {webhookURL}")
    airflow_host_base_address = Variable.get("airflow_host_base_address", default_var=None)
    message = message.replace("localhost:8080", airflow_host_base_address)
    print(message)

    response = requests.post(webhookURL, json={"text": message}, verify=False)

    if response.status_code != 200:
        print(f"Failed to send message: {response.text}")
