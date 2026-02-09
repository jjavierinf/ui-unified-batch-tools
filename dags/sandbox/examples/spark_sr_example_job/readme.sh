# Create the conn if needed
airflow connections add spark_default \
    --conn-type spark \
    --conn-host spark://spark-master-0.spark-headless.spark.svc.cluster.local:7077 \
    --conn-extra '{
        "queue": "root.default",
        "extra__spark__spark.jars.ivy": "/tmp/.ivy",
        "spark.jars.ivy": "/tmp/.ivy"
}'
