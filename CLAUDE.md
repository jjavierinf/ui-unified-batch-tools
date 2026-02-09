# UI Scaffold - Next.js Mock Interface

## Objetivo

Scaffold de una UI en Next.js con datos mock y flujos que replican el comportamiento final de: navegación de repo, edición de SQL, diff, submit, aprobación y ordenamiento de tareas de pipeline — sin integraciones reales.

## Flujos principales

1. **Repo browser**: Árbol de archivos filtrado a `.sql`, creación/edición solo de SQL
2. **Editor + Diff**: Editor con tab de diff comparando buffer actual vs último guardado
3. **Submit flow**: Dev submit = cambio de estado; Prod submit = solicita aprobación, luego aprobar para mergear
4. **Pipeline ordering**: Drag/drop de tareas (nombres de archivos SQL), persistido en localStorage
5. **DAG config**: Schedule interval + tags por pipeline

## Estructura

```
ui/
├── src/
│   ├── components/   # Componentes UI
│   └── lib/          # Mock data + helpers de storage
```

## Mock Data

Usar nombres reales del repo de Airflow para que la demo sea reconocible. Ver `mock_data_reference.md` para:
- Convención de nombres de tablas (stage/data_model)
- DAGs reales con schedules y tags
- Rutas de archivos SQL reales

### Tablas ejemplo
- `db_stage.Accounts_dbo_AccountReference`
- `db_data_model.GamingIntegration_tr_GameTransaction`

### DAGs ejemplo
| DAG | Schedule | Tags |
|-----|----------|------|
| `dag_CRM_integration_dbo_AccountReference` | `7 0,3,6,9,12,15,18,21 * * *` | CRM_integration, snapshot |
| `dag_CRM_integration_tr_GameTransaction` | `0 * * * *` | CRM_integration, incremental |

## Referencias

- `CLAUDE_airflow_ref.md` - Contexto del proyecto Airflow original
- `mock_data_reference.md` - Datos mock detallados
- `plan/nextjs_ui_scaffold_fb273548.plan.md` - Plan de implementación
- `dags/` - DAGs reales de Airflow (referencia)
- `plugins/` - Plugins de Airflow (referencia)
