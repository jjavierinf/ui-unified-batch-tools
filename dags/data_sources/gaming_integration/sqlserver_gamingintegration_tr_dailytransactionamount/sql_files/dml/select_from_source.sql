SELECT *
FROM tr.DailyTransactionAmount
WHERE (rowCreated <= DATEADD(HOUR, 1, CAST('<saga_logical_run_ts>' AS DATETIME))
  AND rowCreated > DATEADD(HOUR, -1, CAST('<saga_logical_run_ts>' AS DATETIME))) OR
  (rowModified <= DATEADD(HOUR, 1, CAST('<saga_logical_run_ts>' AS DATETIME))
  AND rowModified > DATEADD(HOUR, -1, CAST('<saga_logical_run_ts>' AS DATETIME)));