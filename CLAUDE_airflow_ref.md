# Claude Code Instructions for DAGs Repository

## Repository Structure

This is an Airflow DAGs repository with the following structure:
- `dags/` - Main DAGs directory
  - `CRM_integration/` - CRM data integration DAGs
  - `BEATS_integration/` - BEATS data integration DAGs
  - `data_sources/` - Source-specific ELT DAGs
  - `projects/` - Project-specific DAGs
  - `sandbox/` - Experimental/test DAGs

## DAG Patterns

### Standard ELT DAG Structure
Each DAG typically has:
- `conf.yaml` or `elt_config.yaml` - Configuration
- `dag_*.py` - DAG definition
- `sql_files/`
  - `ddl/` - Table creation scripts (stage, data_model)
  - `dml/` or `transformations/` - Data transformation SQL

### Common Tasks
1. `create_table_stage` - Creates staging table
2. `create_table_data_model` - Creates data model table
3. `extract_and_load` - Extracts from source to stage (usually Spark)
4. `data_model_task` - Transforms stage to data model
5. `delete_logs` / `delete_old_logs` - Cleanup old stage records

### Key Conventions
- Stage tables: `db_stage.<table_name>`
- Data model tables: `db_data_model.<table_name>`
- Use `saga_hash` for incremental loading (hash-based deduplication)
- Use `saga_logical_run_ts` and `saga_real_run_ts` for tracking runs
- Jinja templates with `{{ ts | convert_utc_to_et("US/Eastern") }}` for timestamps

## Using Ralph Loop

Ralph Loop is useful for autonomous multi-step tasks in this codebase.

### Start Ralph Loop
```
/ralph-loop
```

### Good Use Cases for Ralph Loop
1. **Creating a new DAG from scratch** - Ralph can create all files (conf.yaml, DAG py, DDL, DML)
2. **Converting a DAG to incremental** - Modify multiple SQL files and DAG definition
3. **Adding new columns across stage/model** - Update DDL, DML, and transformations
4. **Refactoring multiple similar DAGs** - Apply same pattern across many DAGs
5. **Debugging DAG issues** - Analyze logs, trace data flow, fix SQL

### Example Ralph Loop Prompts
- "Create a new ELT DAG for table X from source Y following the pattern in CRM_integration"
- "Convert DAG X from full load to incremental using saga_hash pattern"
- "Add column Z to DAG X - update stage DDL, model DDL, and transformation SQL"
- "Fix the data type mismatch in DAG X between stage and model"

### Cancel Ralph Loop
```
/cancel-ralph
```

## Git Workflow
- Feature branches: `feature/TICKET-description`
- Commit messages: Short, imperative, in English
- Always test DAGs in dev environment before merging

## Testing DAGs
1. Push to feature branch
2. DAG will be picked up by Airflow in dev
3. Trigger manual run or wait for schedule
4. Check task logs in Airflow UI
