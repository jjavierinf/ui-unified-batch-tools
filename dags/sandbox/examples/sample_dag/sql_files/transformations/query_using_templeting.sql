SELECT * FROM db_data_model_DEVELOP.customer_details WHERE created_at <= '{{ ts | convert_utc_to_et }}'
;
