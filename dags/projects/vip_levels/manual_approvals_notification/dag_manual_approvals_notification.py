from airflow import DAG
from airflow.models import Variable
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.providers.mysql.operators.mysql import MySqlOperator
from airflow.utils.dates import days_ago
from custom_alerts_v1_0_9 import send_webhook_alert

starrocks_conn = Variable.get("starrocks_conn")
msp_conn = Variable.get("manual_approval_rewards_stream_msp")
email_campaigns = Variable.get("manual_approval_rewards_stream_email_campaigns")


default_args = {
    "owner": "m.zalazar",
    "retries": 1,
}

with DAG(
    "dag_manual_approvals_notification",
    default_args=default_args,
    description="Manual Approval Rewards Stream MSP Publisher",
    schedule="@continuous",
    max_active_runs=1,
    template_searchpath="/opt/airflow/data/dags/repo/projects/vip_levels/manual_approvals_notification/sql_files/",
    start_date=days_ago(1),
    tags=["msp","spark", "bocato", "manual_approval_reward"],
    on_failure_callback=send_webhook_alert,
) as dag:
    
    create_db_report_v_vip_levels_manual_approval_msp_pendings = MySqlOperator(
        task_id="create_db_report_v_vip_levels_manual_approval_msp_pendings",
        sql="db_report_v_vip_levels_manual_approval_msp_pendings.sql",
        mysql_conn_id="starrocks_connection",
    )

    create_db_report_vip_levels_manual_approval_msp_logs = MySqlOperator(
        task_id="create_db_report_vip_levels_manual_approval_msp_logs",
        sql="db_report_vip_levels_manual_approval_msp_logs.sql",
        mysql_conn_id="starrocks_connection",
    )

    submit_job = SparkSubmitOperator(
        task_id="msp_publisher",
        conn_id="spark_default",
        application="/opt/airflow/data/dags/repo/projects/vip_levels/manual_approvals_notification/spark/msp_publisher_job.py",
        packages="mysql:mysql-connector-java:8.0.33,com.starrocks:starrocks-spark-connector-3.4_2.12:1.1.2",
        name="msp_publisher",
        verbose=False,
        executor_cores=1,
        executor_memory="2g",
        driver_memory="2g",
        num_executors=1,
        total_executor_cores=1,
        application_args=[msp_conn, starrocks_conn, email_campaigns],
    )

    # Define task dependencies
    (
        create_db_report_vip_levels_manual_approval_msp_logs
        >> create_db_report_v_vip_levels_manual_approval_msp_pendings
        >> submit_job
    )
