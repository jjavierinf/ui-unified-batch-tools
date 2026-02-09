import logging
from airflow.models import TaskInstance
from airflow.settings import Session
from airflow.timetables.simple import ContinuousTimetable
from cron_descriptor import Options, CasingTypeEnum, DescriptionTypeEnum, ExpressionDescriptor
from notifications.services.notification_config import NotificationConfig
from notifications.services.error_log_service import ErrorLogService
from notifications.services.failure_message_info import FailureMessageInfo

class FailureMessageService:
    def __init__(self, notification_config: NotificationConfig, error_log_service: ErrorLogService):
        self.config = notification_config
        self.error_log_service = error_log_service

    def get_dag_failure_message_info(self, context) -> FailureMessageInfo:
        try:            
            dag = context['dag']
            dag_run = context['dag_run']
            if dag_run.state == 'failed':
                failed_task_instance = self._get_failed_task_instance(dag, dag_run)

                schedule_interval, cron_translation, next_run = self._resolve_timetable(dag, dag_run)

                log_summary = self.error_log_service.fetch_log_summary(
                    dag_id=dag.dag_id,
                    dag_run=dag_run,
                    failed_task_instance=failed_task_instance
                )

                log_file_url = self.error_log_service.get_log_file_url(failed_task_instance)

                return FailureMessageInfo(
                    dag,
                    self.config.airflow_host_base_address, 
                    failed_task_instance,
                    schedule_interval,
                    cron_translation,
                    next_run,
                    log_summary,
                    log_file_url
                )                
        except Exception as e:
            logging.error(f"An error occurred: {str(e)}")
    
    def _resolve_timetable(self, dag, dag_run):
        if isinstance(dag.timetable, ContinuousTimetable):
            schedule_interval = '@continuous'
            cron_translation = 'Continuous execution'
            next_run = '@continuous'
        else:
            schedule_interval = dag.schedule_interval
            cron_translation = self._get_cron_description(schedule_interval)
            next_run = dag.following_schedule(dag_run.execution_date)
        return schedule_interval,cron_translation,next_run

    def _get_failed_task_instance(self, dag, dag_run):
        return (
            Session.query(TaskInstance)
            .filter(TaskInstance.dag_id == dag.dag_id, 
                    TaskInstance.start_date >= dag_run.execution_date,
                    TaskInstance.state == 'failed')
            .order_by(TaskInstance.start_date.desc())
            .first()
        )

    def _get_cron_description(self, cron_schedule):
        try:
            options = Options()
            options.casing_type = CasingTypeEnum.Sentence
            options.use_24hour_time_format = False
            options.verbose = True
            descriptor = ExpressionDescriptor(cron_schedule, options)
            return descriptor.get_description(DescriptionTypeEnum.FULL)
        except Exception as e:
            return f"Error translating cron schedule: {str(e)}"