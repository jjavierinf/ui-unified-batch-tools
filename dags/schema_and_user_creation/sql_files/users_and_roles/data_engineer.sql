--Create the role
CREATE ROLE IF NOT EXISTS data_engineer
;
-- Give access to the role
GRANT SELECT ON *.* TO ROLE 'data_engineer'
; 
GRANT ALL PRIVILEGES ON db_business_model_DEVELOP.* TO ROLE 'data_engineer'
; 
GRANT ALL PRIVILEGES ON db_data_model_DEVELOP.* TO ROLE 'data_engineer'
; 
GRANT ALL PRIVILEGES ON db_stage_DEVELOP.* TO ROLE 'data_engineer'
;
-- Create userts with that role
CREATE USER IF NOT EXISTS akwiek@'%' IDENTIFIED BY 'loQueSea' DEFAULT ROLE 'data_engineer'
;