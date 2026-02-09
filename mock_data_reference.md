# Referencia para data mock (tablas y pipelines reales)

La UI mock debe usar **nombres de tablas y pipelines reales** de este repo para que la demo sea reconocible (p. ej. para el jefe). Abajo hay ejemplos extraídos de DAGs reales.

## Convención de nombres

- **Stage:** `db_stage.<Source>_<schema>_<table>` (ej. `db_stage.GamingIntegration_tr_GameTransaction`)
- **Data model:** `db_data_model.<Source>_<schema>_<table>` (mismo nombre base que stage)
- **DAG:** `dag_<integration>_<schema>_<Table>` o `dag_<integration>_<desc>`

---

## Tablas reales (usar en árbol de archivos / SQL mock)

### CRM_integration
| Stage table | Data model table | Origen |
|-------------|------------------|--------|
| `db_stage.Accounts_dbo_AccountReference` | `db_data_model.Accounts_dbo_AccountReference` | AccountReference |
| `db_stage.GamingIntegration_gc_Game` | `db_data_model.GamingIntegration_gc_Game` | Game |
| `db_stage.GamingIntegration_tr_GameTransaction` | `db_data_model.GamingIntegration_tr_GameTransaction` | GameTransaction |

### BEATS_integration
| Stage table | Data model table | Origen |
|-------------|------------------|--------|
| `db_stage.Accounts_dbo_AccountLogType` | `db_data_model.Accounts_dbo_AccountLogType` | AccountLogType |

### data_sources (gaming_integration)
| Stage table | Data model table |
|-------------|------------------|
| `db_stage.gamingintegration_tr_dailytransactionamount` | `db_data_model.gamingintegration_tr_dailytransactionamount` |

---

## Pipelines / DAGs reales (usar en listado y orden de tareas mock)

| DAG name | Schedule | Tags | Tipo |
|----------|----------|------|------|
| `dag_CRM_integration_dbo_AccountReference` | `7 0,3,6,9,12,15,18,21 * * *` | CRM_integration, snapshot | snapshot |
| `dag_CRM_integration_gc_Game` | `5 0,3,6,9,12,15,18,21 * * *` | CRM_integration, snapshot | snapshot |
| `dag_CRM_integration_tr_GameTransaction` | `0 * * * *` | CRM_integration, incremental | incremental |
| `dag_BEATS_integration_dbo_AccountLogType` | `0 6 * * *` | BEATS_integration, snapshot | snapshot |
| `dag_manual_approvals_notification` | (manual) | projects | notification |

---

## Archivos SQL reales (rutas para árbol mock)

```
dags/CRM_integration/AccountReference/sql_files/ddl/create_table_stage.sql
dags/CRM_integration/AccountReference/sql_files/ddl/create_table_data_model.sql
dags/CRM_integration/AccountReference/sql_files/transformations/data_model_task.sql
dags/CRM_integration/Game/sql_files/ddl/create_table_stage.sql
dags/CRM_integration/Game/sql_files/ddl/create_table_data_model.sql
dags/CRM_integration/GameTransaction/sql_files/ddl/create_table_stage.sql
dags/CRM_integration/GameTransaction/sql_files/transformations/data_model_task.sql
dags/BEATS_integration/AccountLogType/sql_files/ddl/create_table_stage.sql
dags/data_sources/gaming_integration/.../create_table_stage.sql
```

Usar estos nombres y rutas en fixtures/localStorage del UI para que la demo refleje el repo real.
