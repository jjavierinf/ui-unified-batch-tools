INSERT INTO db_business_model_DEVELOP.customer_birthdate_aggregation (customer_birthdate, customer_count)
SELECT 
    birthdate,
    COUNT(customer_id) AS customer_count
FROM  db_data_model_DEVELOP.customer_details
GROUP BY birthdate
;