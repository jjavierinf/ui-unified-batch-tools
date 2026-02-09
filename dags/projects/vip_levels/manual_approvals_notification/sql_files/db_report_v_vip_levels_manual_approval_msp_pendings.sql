CREATE OR REPLACE VIEW db_report.v_vip_levels_manual_approval_msp_pendings
AS
WITH aux_published_logs AS(
    SELECT _id, 
           createdAt, 
           published, 
           retries
      FROM db_report.vip_levels_manual_approval_msp_logs
     WHERE createdAt >= DAYS_SUB(convert_tz(NOW(),'GMT','US/Eastern'), 2)
)
    SELECT mar._id,
           mar.customerId,
           mar.tenantId AS brandId,
           mar.customerDetailsLevelId levelId,
           vl.description level,
           mar.bonusAmount,
           COALESCE(logs.retries, 0) AS retries,
           logs.published,
           mar.createdAt
      FROM db_data_model.mv_bocato_manual_approval_reward mar
INNER JOIN db_data_model.BI_vip_levels vl
        ON mar.customerDetailsLevelId = vl.levelId
       AND mar.tenantId = vl.brandId
 LEFT JOIN aux_published_logs logs
        ON mar._id = logs._id 
     WHERE (logs.published IS NULL OR (NOT logs.published AND retries <= 2))
       AND mar.createdAt >= DAYS_SUB(convert_tz(NOW(),'GMT','US/Eastern'), 1)
  ORDER BY mar.createdAt DESC, mar._id