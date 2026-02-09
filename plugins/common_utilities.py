
def get_config_and_paths(current_dir):
    import os
    import yaml
    import pytz
    from datetime import datetime
    # current_dir = os.path.dirname(os.path.abspath(__file__))
    conf_yaml_path = os.path.join(current_dir, 'conf.yaml')
    sql_path = os.path.join(current_dir, 'sql_files')
    create_table_stage_sql_path = os.path.join(sql_path, 'ddl/create_table_stage.sql')

    if not os.path.exists(conf_yaml_path):
        raise Exception(f"conf.yaml not found in {current_dir}. Please make sure the file exists.")

    with open(conf_yaml_path, 'r') as conf_file:
        conf = yaml.safe_load(conf_file)

    base_start_date = conf['dag_config']['dag_start_date']
    source_timezone = pytz.timezone(conf['source']['source_timezone'])
    dag_start_date_tz = source_timezone.localize(datetime.fromisoformat(base_start_date))

    file_names = [
        "ddl/create_table_data_model.sql",
        "ddl/create_table_stage.sql",
        "transformations/data_model_task.sql"
    ]

    missing_files = []

    for file_name in file_names:
        file_path = os.path.join(sql_path, file_name)
        if not os.path.exists(file_path):
            missing_files.append(file_name)

    if missing_files:
        missing_files_str = ', '.join(missing_files)
        raise FileNotFoundError(f"The following files do not exist: {missing_files_str}")

    return conf, current_dir, sql_path, create_table_stage_sql_path, dag_start_date_tz, conf_yaml_path

# Function to create a numeric hash using hashlib
def create_numeric_hash(*args):
    import hashlib 
    cleaned_args = [str(arg) if arg is not None else '' for arg in args]
    combined_values = ''.join(map(str, cleaned_args))
    hash_object = hashlib.sha256(combined_values.encode())
    truncated_hash = hash_object.digest()[:7]
    numeric_hash = int.from_bytes(truncated_hash, byteorder='big')
    return numeric_hash
