INSERT INTO db_data_model_DEVELOP.customer_details (customer_id, customer_name, birthdate, created_at)
SELECT 
    CAST(customer_id AS BIGINT) AS customer_id,
    customer_name AS customer_name,
    CAST(birthdate AS DATE) AS birthdate,
    CAST(created_at as DATE) as created_at
FROM db_stage_DEVELOP.customer_details
;