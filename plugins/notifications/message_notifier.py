from airflow.notifications.basenotifier import BaseNotifier
from notifications.services.notification_config import NotificationConfig
from notifications.services.notification_webhook_service import NotificationWebhookService

class MessageNotifier(BaseNotifier):
    template_fields = ("message",)

    def __init__(self, message):
        self.config = NotificationConfig() 
        self.notification_webhook_service = NotificationWebhookService(self.config)      
        self.message = message
    
    def notify(self, context):
        if not self.config.notifications_enabled:
            return
        self.notification_webhook_service.send_message(self.message)    
