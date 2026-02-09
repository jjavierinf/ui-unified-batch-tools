from airflow.notifications.basenotifier import BaseNotifier
from notifications.services.notification_config import NotificationConfig
from notifications.services.error_log_service import ErrorLogService
from notifications.services.failure_message_service import FailureMessageService
from notifications.services.notification_webhook_service import NotificationWebhookService

class OnDagFailureNotifier(BaseNotifier):

    def __init__(self):
        self.config = NotificationConfig()
        error_log_service = ErrorLogService(self.config)
        self.failure_message_service = FailureMessageService(self.config, error_log_service)
        self.notification_webhook_service = NotificationWebhookService(self.config)
    
    def notify(self, context):
        if not self.config.notifications_enabled:
            return
        if not self._skip_alert(context['dag_run']):
            failure_message_info = self.failure_message_service.get_dag_failure_message_info(context)   
            failure_message = failure_message_info.get_dag_failure_printable_message()
            self.notification_webhook_service.send_message(failure_message)

    def _skip_alert(self, dag_run):
        prev_dag_run = dag_run.get_previous_dagrun()
        if (prev_dag_run is None
            or (dag_run.execution_date.hour == prev_dag_run.execution_date.hour
            and dag_run.execution_date.day == prev_dag_run.execution_date.day)
            ):
            print(f"*** Alert skipped!!! Current run: {dag_run.execution_date} - Previous run: {prev_dag_run.execution_date}") 
            return True
        else:
            return False 

    
