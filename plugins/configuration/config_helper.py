def get_config_and_paths(current_dir):
    import os
    import json
    import pytz
    from datetime import datetime

    config_json_path = os.path.join(current_dir, 'config.json')
    sql_path = os.path.join(current_dir, 'sql_files')
    create_table_stage_sql_path = os.path.join(sql_path, 'ddl/create_table_stage.sql')

    if not os.path.exists(config_json_path):
        raise Exception(f"config.json not found in {current_dir}. Please make sure the file exists.")

    with open(config_json_path, 'r') as conf_file:
        config = json.load(conf_file)

    base_start_date = config['dag_config']['dag_start_date']
    source_timezone = pytz.timezone(config['source']['source_timezone'])
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

    return config, current_dir, sql_path, create_table_stage_sql_path, dag_start_date_tz, config_json_path
