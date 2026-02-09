import sys
import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import json
sys.path.append("/opt/airflow/data/plugins")

# Try to import StarRocksClient, but don't fail if it's not available
StarRocksClient = None
try:
    from starrocks_loader import StarRocksClient
except ImportError as e:
    print(f"Warning: Could not import StarRocksClient: {e}")
    # This will only affect load_data_to_starrocks function

airflow_variable_imported = False
try:
    from airflow.models import Variable
    airflow_variable_imported = True
except Exception as e:
    print(f"Error importing airflow.models.Variable: {e}")

def get_safe_variable(var_name, default_value):
    """Safely get an Airflow Variable with a fallback default value"""
    if airflow_variable_imported:
        try:
            return Variable.get(var_name, default_value)
        except:
            return default_value
    else:
        return default_value

def get_connection():
    """Get database connection using configuration from multiple sources with fallback"""
    
    # Hardcoded fallback for starrocks_mysql_conn
    mysql_fallback = {
        "db": "db_stage",
        "host": "starrocks-saga-nonprod.itsops.net",
        "password": "test",
        "port": 9030,
        "user": "root"
    }
    
    if airflow_variable_imported:
        try:
            starrocks_mysql_conn = Variable.get("starrocks_mysql_conn", mysql_fallback)
            # If it's a string, parse it as JSON
            if isinstance(starrocks_mysql_conn, str):
                starrocks_mysql_conn = json.loads(starrocks_mysql_conn)
        except Exception as e:
            print(f"Error getting starrocks_mysql_conn variable: {e}")
            starrocks_mysql_conn = mysql_fallback
    else:
        starrocks_mysql_conn = mysql_fallback
    db = 'db_stage'

    return connect_to_starrocks(
        starrocks_mysql_conn["host"],
        starrocks_mysql_conn["user"],
        starrocks_mysql_conn["password"],
        starrocks_mysql_conn["port"],
        db
    )

def connect_to_starrocks(host, user, password, port, database):
    """
    Establish a connection to the StarRocks database using SQLAlchemy.

    Parameters:
    - host: Database host
    - user: Username for the database
    - password: Password for the database
    - port: Port for the database connection
    - database: Name of the database

    Returns:
    - engine: SQLAlchemy engine object for the database connection
    """
    try:
        # Create a SQLAlchemy engine for the MySQL database
        connection_string = f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}"
        engine = create_engine(connection_string)
        return engine
    except Exception as e:
        print(f"Error connecting to the database: {str(e)}")
        return None

def execute_command(connection, command):
    """
    Execute a SQL command on the database.

    Parameters:
    - connection: SQLAlchemy engine object
    - command: SQL command to execute

    Returns:
    - bool: True if execution was successful
    """
    try:
        with connection.connect() as conn:
            conn.execute(text(command))
            return True
    except Exception as e:
        print(f"An error occurred while executing command: {e}")
        return False

def read_mysql_table_to_dataframe(connection, table_name, limit=None, where=None):
    """
    Read data from a MySQL table into a Pandas DataFrame.

    Parameters:
    - connection: SQLAlchemy engine object
    - table_name: Name of the table to read from
    - limit: Optional limit on the number of records to retrieve
    - where: Optional WHERE clause for filtering records

    Returns:
    - DataFrame: A Pandas DataFrame containing the queried data
    """
    # Base query
    query = f"SELECT * FROM {table_name}"

    # Append WHERE clause if provided
    if where is not None:
        query += f" WHERE {where}"

    # Append LIMIT clause if provided
    if limit is not None:
        query += f" LIMIT {limit}"

    # Execute the query and fetch the result into a Pandas DataFrame
    df = pd.read_sql(query, connection)

    return df

def write_dataframe_to_table(dataframe, table_name, conn):
    """
    Write a DataFrame to a MySQL table.

    Parameters:
    - dataframe: DataFrame to write to the table
    - table_name: Name of the target SQL table
    - conn: SQLAlchemy engine object
    """
    # Replace NaN values with None for SQL compatibility
    dataframe = dataframe.where(pd.notnull(dataframe), None)
    schema, table = get_database_and_table(table_name)

    try:
        # Write the DataFrame to the SQL table
        dataframe.to_sql(table, conn, if_exists='append', index=False, schema=schema)
        print(f"Data written to table '{table_name}' successfully.")
    except Exception as e:
        print(f"An error occurred while writing to table '{table_name}': {e}")
        print("Attempting to insert using API load")
        try:
            load_data_to_starrocks(dataframe, table_name)
        except Exception as e:
            print(f"Loading using API failed!")
            raise

def load_data_to_starrocks(df_to_write, table_name):
    if StarRocksClient is None:
        raise ImportError("StarRocksClient is not available. Cannot use load_data_to_starrocks function.")
    
    formatted_rows = []
    columns = df_to_write.columns
    # Iterate through the Spark DataFrame and extract data
    for index, row in df_to_write.iterrows():
        # Get all column values for the current row
        formatted_row = [row[column] for column in columns]
        formatted_rows.append(formatted_row)

    # Hardcoded fallback for starrocks_conn
    conn_fallback = {
        "be_host": "starrocks-saga-nonprod.itsops.net",
        "user": "root",
        "password": ""
    }
    
    starrocks_conn = get_safe_variable("starrocks_conn", conn_fallback)
    # If it's a string, parse it as JSON
    if isinstance(starrocks_conn, str):
        try:
            starrocks_conn = json.loads(starrocks_conn)
        except Exception as e:
            print(f"Error parsing starrocks_conn as JSON: {e}")
            starrocks_conn = conn_fallback
    database, table = get_database_and_table(table_name)

    # Initialize the StarRocksClient
    client = StarRocksClient(
        host=starrocks_conn['be_host'],
        port="8040",
        database=database,
        username=starrocks_conn['user'],
        password=starrocks_conn['password'],
        table=table,
        columns=",".join(df_to_write.columns),
        sep="<~>",
        timeout=86400,
    )
    client._load_from_memory_as_json(data=formatted_rows)

def get_database_and_table(table_name):
    if '.' in table_name:
        database, table = table_name.split('.')
    else:
        database = 'db_stage'
        table = table_name
    return database, table

print("DEBUG: starrocks_mysql_conn.py module loading completed successfully")
