from dataclasses import dataclass

@dataclass
class FailureMessageInfo:
    dag: object
    environment: str
    failed_task_instance: object
    schedule_interval: str
    cron_translation: str
    next_run: str
    log_summary: str
    log_file_url: str

    def __init__(self, dag, environment, failed_task_instance, schedule_interval, cron_translation, next_run, log_summary, log_file_url):
        self.dag = dag
        self.environment = environment
        self.failed_task_instance = failed_task_instance
        self.schedule_interval = schedule_interval
        self.cron_translation = cron_translation
        self.next_run = next_run
        self.log_summary = log_summary
        self.log_file_url = log_file_url       

    def get_dag_failure_printable_message(self):
        return (
            f":siren: **DAG '{self.dag.dag_id}' failed** :siren:\n"            
            f"**Tags: {self.dag.tags or 'No tags'}**\n"
            f"**Interval:** {self.schedule_interval} - {self.cron_translation}\n"
            f"**Next run:** {self.next_run}\n"
            f"**Execution date:** {self.failed_task_instance.start_date}\n"
            f"**Owner: @{self.dag.owner}**\n"
            f"Environment: {self.environment}\n"
            f"Task: {self.failed_task_instance.task_id}\n"
            f"Task end date: {self.failed_task_instance.end_date}\n"
            f"**Error summary:**\n"
            f"```\n"
            f"{self.log_summary}\n"
            f"```\n"
            f"**[View Log]({self.failed_task_instance.log_url})** | "
            f"**[Download Log]({self.log_file_url})** | "
            f"**[View DAG]({self.environment}/dags/{self.dag.dag_id})** | "
            f"**[View Documentation](https://confluence.itspty.com/display/DD/{self.dag.dag_id})**\n"
        )