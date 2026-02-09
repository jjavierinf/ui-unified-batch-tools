from airflow.models import Variable
from dataclasses import dataclass
from typing import List

@dataclass
class NotificationConfig:
    notifications_enabled: bool
    webhook_url: str
    airflow_host_base_address: str
    log_summary_search_words: List[str]
    log_summary_max_lines: int
    log_allowed_max_size_in_mb: int

    def __init__(self, webhook_url: str = None):
        config = self._get_config()
        self.notifications_enabled = config["notifications_enabled"]
        self.webhook_url = webhook_url or config["webhook_url"]
        self.airflow_host_base_address = config["airflow_host_base_address"]
        self.log_summary_search_words = config["log_summary_search_words"]
        self.log_summary_max_lines = config["log_summary_max_lines"]
        self.log_allowed_max_size_in_mb = config["log_allowed_max_size_in_mb"]

    def _get_config(self):
        return Variable.get("airflow_dags_notifications_configuration", deserialize_json=True)