import logging
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

class SQLServerWriter:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    def __init__(self, host, user, password, database):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.engine = create_engine(
            f"mssql+pymssql://{self.user}:{self.password}@{self.host}/{self.database}"
        )

    def write_data(self, df, schema, table, if_exists="append"):
        try:
            with self.engine.connect() as connection:
                with connection.begin():
                    df.to_sql(name=table, con=connection, schema=schema, if_exists=if_exists, index=False)
                    logging.info(f"Data written successfully to {schema}.{table} with if_exists={if_exists}")
        except SQLAlchemyError as e:
            logging.error(f"Failed to write data to {schema}.{table}: {e}")
            raise

# writer = SQLServerWriter(conn['host'], conn['user'], conn['password'], conn['db'])
# writer.write_data(df, 'your_schema', 'your_table', 'replace')