import time
import logging
import requests
import json
import os
import datetime
import pandas as pd

class StarRocksClient(object):
    def __init__(self, host, port, database, columns, sep, username, password, table, timeout):
        self.table = table
        self.columns = columns
        self.sep = sep
        self.host = host
        self.port = port
        self.database = database
        self.user = username
        self.password = password
        self.timeout = timeout
        self.label = self.get_label()
        self.base_url = f"http://{self.host}:{self.port}/api/{self.database}/{self.table}/_stream_load"
        self.auth = (self.user, self.password)

    def setup_logging(self):
        # Define the log file path
        log_file = os.path.join('/mnt/data/', f"{self.label}.log")

        # Configure the logging module
        logging.basicConfig(
            filename=log_file,
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
        )
    def get_label(self):
        t = time.time().__str__().replace(".", "_")
        return '_'.join([self.database, self.table, t])
    
    def _load_common(self, payload, load_type = 'csv',):
        try:
            headers = {
                "Content-Type": f"text/{load_type}",
                "format": f"{load_type}",
                "strip_outer_array": "true",
                "columns": self.columns,
                "column_separator": self.sep,
                "label": self.label,
                "enclose": '"',
                "timeout": str(self.timeout)
             }
            
            logging.info(f'Payload len is { len(payload)}')
            logging.info(f"Headers: {headers}")
            if len(payload) > 2:

                response = requests.put(self.base_url, headers=headers, auth=self.auth, data=payload)
                response.raise_for_status()

                result = response.json()
                txn_id = result.get("TxnId")
                status = result.get("Status")
                number_total_rows = result.get("NumberTotalRows")
                number_loaded_rows = result.get("NumberLoadedRows")
                load_time_ms = result.get("LoadTimeMs")
                error_url = result.get("ErrorURL",None)
                message = result.get("Message",None)

                # Log the entire response along with extracted fields
                logging.info("Response:")
                logging.info(json.dumps(result, indent=4))

                logging.info(f"\nLoad to StarRocks {status}! LABEL is {self.label}")
                logging.info(f"TxnId: {txn_id}")
                logging.info(f"Status: {status}")
                logging.info(f"Number of Total Rows: {number_total_rows}")
                logging.info(f"Number of Loaded Rows: {number_loaded_rows}")
                logging.info(f"Load Time (ms): {load_time_ms}")
                if status == 'Fail':
                    error_message = f"Load to StarRocks failed! LABEL is {self.label}\nTxnId: {txn_id}\nStatus: {status}\nNumber of Total Rows: {number_total_rows}\nNumber of Loaded Rows: {number_loaded_rows}\nLoad Time (ms): {load_time_ms}\nResponse: {json.dumps(result, indent=4)}"
                    logging.error(error_message)

                    if message:
                        error_message += f"\nError Message: {result['Message']}"

                    if error_url:
                        # If there's an error URL, log its content and include it in the exception message
                        logging.error("Error while loading, checking the URL response")
                        logging.error("------------------------------------------")
                        res = requests.get(result['ErrorURL'])
                        error_message += f"\nError URL Response:\n{res.text}"
                        logging.error(res.text)
                        logging.error("------------------------------------------")

                    raise Exception(error_message)
            
                return status

        except requests.exceptions.RequestException as e:
            logging.error(f"Error occurred during the request: {e}")
            raise e
        except ValueError as e:
            logging.error(f"Error occurred while parsing the response: {e}")
            raise e

    def load(self, data=None, filename=None):
        """
        Loads data into StarRocks.

        Args:
            data (list, optional): The data to be loaded, should be in the format returned by `cursor.fetchall()`.
                                   Each row should be a tuple or list representing a row of data.
            filename (str, optional): The name of the file containing the data to be loaded.

        Returns:
            str: The status of the load operation.

        Raises:
            ValueError: If both data and filename are None, or if both are provided.

        """
        if data is None and filename is None:
            raise ValueError("Either data or filename should be provided.")

        if data is not None and filename is not None:
            raise ValueError("Both data and filename cannot be provided simultaneously.")

        if data is not None:
            return self._load_from_memory_as_json(data)
        elif filename is not None:
            return self._load_from_file(filename)
        
    # Deprecated as it can't handle some fields with \n
    def _load_from_memory(self, data):
        payload = '\n'.join([self.sep.join(map(str, row)) for row in data])
        payload = payload.encode('utf-8')

        return self._load_common(payload)
    
    def _load_from_memory_as_json(self, data):
        def convert_timestamp(item):
            if pd.isna(item):
                return None  # Handle NaT as needed, e.g., return None or a specific value
            elif isinstance(item, datetime.datetime):
                return item.strftime('%Y-%m-%d %H:%M:%S')
            else:
                return str(item)  # Convert other types to string representation

        rows_as_dicts = [dict(zip(self.columns.split(','), row)) for row in data]

        # Convert the list of dictionaries to a JSON payload
        payload = json.dumps(rows_as_dicts, ensure_ascii=False, default=convert_timestamp).encode('utf-8')
        return self._load_common(payload,'json')
    
    def _load_from_file(self, filename):
        payload = open(filename, 'rb')
        # Skip the first row (headers) by reading it and not sending it in the payload
        payload.readline()
        
        headers = {
            "Content-Type": f"text/csv'",
            "format": "csv",
            "strip_outer_array": "true",
            "columns": self.columns,
            "column_separator": self.sep,
            "label": self.label,
            "enclose": '"',
            "timeout": str(self.timeout)
            }
        response = requests.put(self.base_url, headers=headers, auth=self.auth, data=payload)
        response.raise_for_status()

        result = response.json()
        logging.info(json.dumps(result, indent=4))
