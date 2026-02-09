--Create the role
CREATE ROLE IF NOT EXISTS data_analyst
;
-- Give access to the role
GRANT SELECT ON *.* TO ROLE 'data_analyst'
; 
-- Create userts with that role
CREATE USER IF NOT EXISTS akwiek@'%' IDENTIFIED BY 'loQueSea' DEFAULT ROLE 'data_analyst'
;
CREATE USER IF NOT EXISTS alex@'%' IDENTIFIED BY 'elBueno_210923' DEFAULT ROLE 'data_analyst'
;