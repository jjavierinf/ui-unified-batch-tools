import argparse
import json
import logging
import time

import requests
from pyspark.sql import SparkSession
from pyspark.sql.functions import current_timestamp, lit, col, concat, from_utc_timestamp
from pyspark.sql.types import StructType, StringType, StructField


def flatten_email_campaigns_data(data):
    flat_data = []
    for brand in data["brands"]:
        brand_id = brand["brandId"]
        brand_name = brand["brandName"]
        for campaign in brand["campaigns"]:
            flat_data.append(
                (brand_id, brand_name, campaign["levelId"], campaign["campaignId"])
            )
    return flat_data


def flatten_whitelist(data):
    flat_whitelist = []
    for brand in data["brands"]:
        brand_id = brand["brandId"]
        for customer in brand["testMode"]["customersWhitelist"]:
            flat_whitelist.append((brand_id, customer))
    return flat_whitelist


def create_campaigns_df(data):
    flat_data = flatten_email_campaigns_data(data)
    columns = ["brandId", "brandName", "levelId", "campaignId"]
    df = spark.createDataFrame(flat_data, schema=columns)
    return df


def create_whitelist_df(data):
    flat_whitelist = flatten_whitelist(data)
    schema = StructType(
        [
            StructField("brandId", StringType(), True),
            StructField("customerId", StringType(), True),
        ]
    )
    df = spark.createDataFrame(flat_whitelist, schema=schema)
    return df


def call_msp_api(row):
    msp_options = broadcast_msp_conn_data.value
    token = broadcast_token.value["access_token"]
    MSP_ENDPOINT = msp_options["apiEndpoint"]
    headers = {"Authorization": f"Bearer {token}"}
    body = {
        "customerID": row["customerId"],
        "brand": row["brandName"],
        "templateID": row["campaignId"],
        "templateParams": {"Level": row["level"], "Amount1": row["bonusAmount"]},
    }
    try:
        # Use Tenacity to retry the API call
        response = requests.post(MSP_ENDPOINT, headers=headers, json=body)
        if response.ok:
            published = True
            retries = row['retries']
            comment = 'SUCCESS'
        else:
            published = False
            retries = row['retries'] + 1
            comment = f"MSP API call failed with status code: {response.status_code}"
    except Exception as e:
        published = False
        retries = row['retries'] + 1
        comment = f"Error when calling MSP API: {str(e)}"

    return (row['_id'], row['createdAt'], published, retries, comment)



def get_msp_bearer_token(config):
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "grant_type": "client_credentials",
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
    }
    response = requests.post(config["authApi"], headers=headers, data=data)
    if response.status_code == 200:
        token_response = response.json()
        token_response["expiry_time"] = time.time() + (
            token_response["expires_in"] - 20
        )
        return token_response
    else:
        raise Exception(
            "Failed to obtain token. Status code: {}".format(response.status_code)
        )


def renew_msp_token_if_expired(broadcast_token, config):
    if time.time() > (broadcast_token.value["expiry_time"]):
        broadcast_token.unpersist()
        token_info = get_msp_bearer_token(config)
        broadcast_token = spark.sparkContext.broadcast(token_info)
        return broadcast_token
    else:
        return broadcast_token


def whitelisting(df, whitelist_df):
    whitelisted = df.join(whitelist_df, on=["brandId", "customerId"])
    non_whitelisted = df.join(
        whitelist_df, on=["brandId", "customerId"], how="left_anti"
    )
    return (non_whitelisted, whitelisted)


def load_and_process(
    starrocks_read_options,
    starrocks_write_options,
    campaigns_df,
    whitelist_df,
    email_campaigns_data,
):
    filtered_df = spark.read.format("jdbc").options(**starrocks_read_options).load()

    for brand in email_campaigns_data["brands"]:
        brand_df = filtered_df.filter(f"brandId='{brand['brandId']}'")

        if brand_df.isEmpty():
            logging.info("brand_df DataFrame is empty. No data to process.")
            continue
        else:
            logging.info("Proceeding with non-empty DataFrame.")

        if brand["testMode"]["enabled"]:
            non_whitelisted_df, whitelist_df = whitelisting(filtered_df, whitelist_df)
            non_whitelisted_df = (
                non_whitelisted_df.select("_id", "createdAt")
                .withColumn("published", lit(True))
                .withColumn("updatedAt", from_utc_timestamp(current_timestamp(),"US/Eastern"))
                .withColumn("retries", lit(0))
                .withColumn("comment", lit("TEST: Non-Whitelisted"))
            )

            non_whitelisted_df.write.format("starrocks").mode("append").options(
                **starrocks_write_options
            ).option(
                "starrocks.columns", "_id, createdAt, published, updatedAt, retries, comment"
            ).save()

            if not whitelist_df.isEmpty():
                whitelist_df = whitelist_df.join(
                    campaigns_df, on=["brandId", "levelId"], how="left"
                )

                msp_rdd = whitelist_df.rdd

                responses_rdd = msp_rdd.map(call_msp_api).collect()

                write_responses = (
                    spark.createDataFrame(
                        responses_rdd, schema=["_id", "createdAt", "published","retries", "comment"]
                    )
                    .withColumn("comment", concat(lit("TEST: "), col("comment")))
                    .withColumn("updatedAt", from_utc_timestamp(current_timestamp(),"US/Eastern"))
                )

                write_responses.write.format("starrocks").mode("append").options(
                    **starrocks_write_options
                ).option(
                    "starrocks.columns", "_id, createdAt, published, updatedAt, retries, comment"
                ).save()

        else:
            brand_df = brand_df.join(
                campaigns_df, on=["brandId", "levelId"], how="left"
            )

            msp_rdd = brand_df.rdd

            responses_rdd = msp_rdd.map(call_msp_api).collect()

            write_responses = spark.createDataFrame(
                responses_rdd, schema=["_id", "createdAt", "published","retries", "comment"]
            ).withColumn("updatedAt", from_utc_timestamp(current_timestamp(),"US/Eastern"))

            write_responses.write.format("starrocks").mode("append").options(
                **starrocks_write_options
            ).option(
                "starrocks.columns", "_id, createdAt, published, updatedAt, retries, comment"
            ).save()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("msp_conn")
    parser.add_argument("starrocks_conn")
    parser.add_argument("email_campaigns")
    args = parser.parse_args()

    try:
        msp_conn_data = json.loads(args.msp_conn)
        starrocks_conn_data = json.loads(args.starrocks_conn)
        email_campaigns_data = json.loads(args.email_campaigns)
        logging.info("Configuration data successfully parsed from arguments.")
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON from arguments: {e}")
        raise

    spark = SparkSession.builder.appName("Manual Approval Rewards MSP Stream Processing").getOrCreate()
    spark.sparkContext.setLogLevel("WARN")

    database = "db_report"
    read_table = "v_vip_levels_manual_approval_msp_pendings"
    write_table = "vip_levels_manual_approval_msp_logs"

    starrocks_read_options = {
        "url": f"jdbc:mysql://{starrocks_conn_data['host']}:9030/{database}",
        "user": starrocks_conn_data["user"],
        "password": starrocks_conn_data["password"],
        "driver": "com.mysql.jdbc.Driver",
        "query": f"select * from {database}.{read_table}",
    }

    starrocks_write_options = {
        "starrocks.table.identifier": f"{database}.{write_table}",
        "starrocks.fe.http.url": f"{starrocks_conn_data['host']}:8030",
        "starrocks.fe.jdbc.url": f"jdbc:mysql://{starrocks_conn_data['host']}:9030/{database}",
        "starrocks.user": starrocks_conn_data["user"],
        "starrocks.password": starrocks_conn_data["password"],
        "spark.starrocks.conf": "write",
        "starrocks.write.properties.format": "json",
        "starrocks.write.properties.partial_update": "true",
    }

    token_info = get_msp_bearer_token(msp_conn_data)
    broadcast_token = spark.sparkContext.broadcast(token_info)

    broadcast_msp_conn_data = spark.sparkContext.broadcast(msp_conn_data)

    campaigns_df = create_campaigns_df(email_campaigns_data)

    campaigns_df.show()

    whitelist_df = create_whitelist_df(email_campaigns_data)

    whitelist_df.show()

    while True:
        broadcast_token = renew_msp_token_if_expired(broadcast_token, msp_conn_data)

        load_and_process(
            starrocks_read_options,
            starrocks_write_options,
            campaigns_df,
            whitelist_df,
            email_campaigns_data,
        )
        time.sleep(10)
