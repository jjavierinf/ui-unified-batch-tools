import os
import re
from notifications.services.notification_config import NotificationConfig

class ErrorLogService:
    
    def __init__(self, notification_config: NotificationConfig):
        self.config = notification_config
   
    def fetch_log_summary(self, dag_id, dag_run, failed_task_instance):
        log_summary_search_words = self.config.log_summary_search_words
        log_allowed_max_size_in_mb = self.config.log_allowed_max_size_in_mb
        log_summary_max_lines = self.config.log_summary_max_lines

        log_base_path = self._get_log_path(dag_id, dag_run, failed_task_instance)
        return self._read_and_summarize_log(log_base_path, log_summary_search_words, log_allowed_max_size_in_mb, log_summary_max_lines)

    def get_log_file_url(self, failed_task_instance):
        try_number = failed_task_instance.try_number - 1
        log_url = failed_task_instance.log_url
        return f"{log_url.replace('log?', 'get_logs_with_metadata?').replace('&map_index=-1', '')}&try_number={try_number}&format=file"

    def _get_log_path(self, dag_id, dag_run, failed_task_instance):
        return os.path.join(
            os.getenv('AIRFLOW_HOME', '/usr/local/airflow'),
            'logs', f'dag_id={dag_id}', f'run_id={dag_run.run_id}',
            f'task_id={failed_task_instance.task_id}', f'attempt={failed_task_instance.try_number-1}.log'
        )

    def _read_and_summarize_log(self, log_path, search_words, max_size_in_mb, max_lines):
        try:
            file_size = os.path.getsize(log_path)
            if file_size <= max_size_in_mb * 1024 * 1024:
                with open(log_path, 'r') as log_file:
                    log_content = log_file.read()
                return self._extract_summary(log_content, search_words, max_lines)
            else:
                return f"DAG log file is too large to be processed: {file_size / (1024 * 1024):.2f} MB. Max size is: {max_size_in_mb} MB."
        except FileNotFoundError:
            return f"DAG log file not found at {log_path}"

    def _extract_summary(self, log_content, search_words, max_lines):
        unique_errors = set()
        summary_lines = []
        for line in log_content.splitlines():
            for pattern in search_words:
                if re.search(pattern, line, re.IGNORECASE):
                    line_without_timestamp = re.sub(r'^\[.*?\]\s*', '', line)
                    if line_without_timestamp not in unique_errors:
                        unique_errors.add(line_without_timestamp)
                        summary_lines.append(line)
        return "\n".join(summary_lines[-max_lines:])