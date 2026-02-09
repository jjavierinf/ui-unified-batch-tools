import logging

import requests
from notifications.services.notification_config import NotificationConfig

class NotificationWebhookService:

    def __init__(self, notification_config: NotificationConfig):
        self.config = notification_config

    def send_message(self, message):
        try:
            url = self.config.webhook_url
            message = message.replace("http://localhost:8080", self.config.airflow_host_base_address)
            logging.info(f"Posting message to URL!: {url}")
            logging.info(message)

            response = requests.post(url, json={"text": message}, verify=False)
            if response.status_code != 200:
                logging.info(f"Failed to post message: {response.text}")

        except Exception as e:
            logging.error(f"An error occurred while posting the message: {str(e)}")