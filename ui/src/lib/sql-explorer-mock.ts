import { deepAnonymize } from "./demo-mode";

export interface MockTable {
  database: string;
  schema: string;
  name: string;
  columns: string[];
  sampleRows: Array<Record<string, string | number>>;
}

export interface MockSchema {
  name: string;
  tables: MockTable[];
}

export interface MockDatabase {
  name: string;
  schemas: MockSchema[];
}

export interface MockConnection {
  id: string;
  name: string;
  engine: string;
  host: string;
  databases: MockDatabase[];
}

export interface QueryResult {
  columns: string[];
  rows: Array<Record<string, string | number>>;
  notice: string;
}

const STAGE_TABLES: MockTable[] = [
  {
    database: "db_stage",
    schema: "dbo",
    name: "Accounts_dbo_AccountReference",
    columns: ["customerID", "saga_hash", "saga_real_run_ts", "saga_logical_run_ts"],
    sampleRows: [
      { customerID: "C001", saga_hash: 101, saga_real_run_ts: "2026-02-11 08:00:00", saga_logical_run_ts: "2026-02-11 08:00:00" },
      { customerID: "C002", saga_hash: 102, saga_real_run_ts: "2026-02-11 08:00:00", saga_logical_run_ts: "2026-02-11 08:00:00" },
    ],
  },
  {
    database: "db_stage",
    schema: "tr",
    name: "GameTransaction",
    columns: ["gameTransactionId", "amount", "rowModified"],
    sampleRows: [
      { gameTransactionId: 9001, amount: 45.9, rowModified: "2026-02-11 07:58:00" },
      { gameTransactionId: 9002, amount: 12.3, rowModified: "2026-02-11 07:59:00" },
    ],
  },
];

const MODEL_TABLES: MockTable[] = [
  {
    database: "db_data_model",
    schema: "dbo",
    name: "Accounts_dbo_AccountReference",
    columns: ["customerID", "saga_hash", "saga_real_run_ts", "bi_note"],
    sampleRows: [
      { customerID: "C001", saga_hash: 101, saga_real_run_ts: "2026-02-11 08:00:00", bi_note: "vip" },
      { customerID: "C002", saga_hash: 102, saga_real_run_ts: "2026-02-11 08:00:00", bi_note: "std" },
    ],
  },
  {
    database: "db_data_model",
    schema: "tr",
    name: "gamingintegration_tr_dailytransactionamount",
    columns: ["dailyTransactionAmountId", "customerID", "balance", "balanceDate", "bi_bucket"],
    sampleRows: [
      { dailyTransactionAmountId: "DTA-1", customerID: "C001", balance: "30.10", balanceDate: "2026-02-10", bi_bucket: "A" },
      { dailyTransactionAmountId: "DTA-2", customerID: "C002", balance: "11.44", balanceDate: "2026-02-10", bi_bucket: "B" },
    ],
  },
];

const RAW_MOCK_CONNECTIONS: MockConnection[] = [
  {
    id: "demo-sqlserver-primary",
    name: "demo_sqlserver_primary",
    engine: "SQL Server",
    host: "mock-sql-primary.internal",
    databases: [
      {
        name: "db_stage",
        schemas: [
          {
            name: "dbo",
            tables: STAGE_TABLES.filter((t) => t.database === "db_stage" && t.schema === "dbo"),
          },
          {
            name: "tr",
            tables: STAGE_TABLES.filter((t) => t.database === "db_stage" && t.schema === "tr"),
          },
        ],
      },
      {
        name: "db_data_model",
        schemas: [
          {
            name: "dbo",
            tables: MODEL_TABLES.filter((t) => t.database === "db_data_model" && t.schema === "dbo"),
          },
          {
            name: "tr",
            tables: MODEL_TABLES.filter((t) => t.database === "db_data_model" && t.schema === "tr"),
          },
        ],
      },
    ],
  },
  {
    id: "demo-postgres-analytics",
    name: "demo_postgres_analytics",
    engine: "PostgreSQL",
    host: "mock-pg-analytics.internal",
    databases: [
      {
        name: "db_stage",
        schemas: [
          {
            name: "dbo",
            tables: STAGE_TABLES.filter((t) => t.database === "db_stage" && t.schema === "dbo"),
          },
          {
            name: "tr",
            tables: STAGE_TABLES.filter((t) => t.database === "db_stage" && t.schema === "tr"),
          },
        ],
      },
    ],
  },
];

export const MOCK_CONNECTIONS: MockConnection[] = deepAnonymize(RAW_MOCK_CONNECTIONS);

function allTables(connection: MockConnection): MockTable[] {
  return connection.databases.flatMap((db) => db.schemas.flatMap((schema) => schema.tables));
}

export function buildInfoSchemaTablesQuery(database?: string, schema?: string): string {
  const where: string[] = [];
  if (database) where.push(`table_catalog = '${database}'`);
  if (schema) where.push(`table_schema = '${schema}'`);
  const whereClause = where.length > 0 ? `\nWHERE ${where.join(" AND ")}` : "";
  return (
    "SELECT table_catalog, table_schema, table_name, table_type\n" +
    "FROM information_schema.tables" +
    whereClause +
    "\nORDER BY table_catalog, table_schema, table_name;"
  );
}

export function buildInfoSchemaColumnsQuery(database: string, schema: string, table: string): string {
  return (
    "SELECT table_catalog, table_schema, table_name, column_name, ordinal_position\n" +
    "FROM information_schema.columns\n" +
    `WHERE table_catalog = '${database}' AND table_schema = '${schema}' AND table_name = '${table}'\n` +
    "ORDER BY ordinal_position;"
  );
}

function filterByWhere(rows: Array<Record<string, string | number>>, query: string): Array<Record<string, string | number>> {
  const schemaMatch = query.match(/table_schema\s*=\s*'([^']+)'/i);
  const catalogMatch = query.match(/table_catalog\s*=\s*'([^']+)'/i);
  const tableMatch = query.match(/table_name\s*=\s*'([^']+)'/i);
  return rows.filter((r) => {
    if (schemaMatch && String(r.table_schema) !== schemaMatch[1]) return false;
    if (catalogMatch && String(r.table_catalog) !== catalogMatch[1]) return false;
    if (tableMatch && String(r.table_name) !== tableMatch[1]) return false;
    return true;
  });
}

export function executeMockQuery(connection: MockConnection, query: string): QueryResult {
  const normalized = query.trim().toLowerCase();
  const tables = allTables(connection);

  if (normalized.includes("information_schema.tables")) {
    const rows = tables.map((t) => ({
      table_catalog: t.database,
      table_schema: t.schema,
      table_name: t.name,
      table_type: "BASE TABLE",
    }));
    const filtered = filterByWhere(rows, query);
    return {
      columns: ["table_catalog", "table_schema", "table_name", "table_type"],
      rows: filtered,
      notice: `Mock query OK · information_schema.tables · ${filtered.length} rows`,
    };
  }

  if (normalized.includes("information_schema.columns")) {
    const rows = tables.flatMap((t) =>
      t.columns.map((col, idx) => ({
        table_catalog: t.database,
        table_schema: t.schema,
        table_name: t.name,
        column_name: col,
        ordinal_position: idx + 1,
      }))
    );
    const filtered = filterByWhere(rows, query);
    return {
      columns: ["table_catalog", "table_schema", "table_name", "column_name", "ordinal_position"],
      rows: filtered,
      notice: `Mock query OK · information_schema.columns · ${filtered.length} rows`,
    };
  }

  const selectTableMatch = query.match(/select\s+\*\s+from\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)/i);
  if (selectTableMatch) {
    const schema = selectTableMatch[1];
    const tableName = selectTableMatch[2];
    const table = tables.find((t) => t.schema.toLowerCase() === schema.toLowerCase() && t.name.toLowerCase() === tableName.toLowerCase());
    if (!table) {
      return {
        columns: ["message"],
        rows: [{ message: `Table ${schema}.${tableName} not found in mock connection` }],
        notice: "Mock query completed with warning",
      };
    }
    return {
      columns: table.columns,
      rows: table.sampleRows,
      notice: `Mock query OK · ${schema}.${tableName} · ${table.sampleRows.length} rows`,
    };
  }

  return {
    columns: ["message"],
    rows: [{ message: "Query executed in mock mode. Use INFORMATION_SCHEMA queries or SELECT * FROM schema.table for tabular output." }],
    notice: "Mock execution OK",
  };
}
