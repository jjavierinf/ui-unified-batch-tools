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
    name: "orders",
    columns: ["id", "created_at", "updated_at", "customer_id", "order_total", "currency", "order_status"],
    sampleRows: [
      {
        id: 1001,
        created_at: "2026-02-12 07:55:00",
        updated_at: "2026-02-12 08:00:00",
        customer_id: 501,
        order_total: 79.99,
        currency: "USD",
        order_status: "paid",
      },
      {
        id: 1002,
        created_at: "2026-02-12 08:02:00",
        updated_at: "2026-02-12 08:05:00",
        customer_id: 502,
        order_total: 19.5,
        currency: "USD",
        order_status: "shipped",
      },
    ],
  },
  {
    database: "db_stage",
    schema: "dbo",
    name: "customers",
    columns: ["id", "created_at", "updated_at", "email_hash", "country", "loyalty_tier"],
    sampleRows: [
      {
        id: 501,
        created_at: "2026-01-10 10:00:00",
        updated_at: "2026-02-12 08:01:00",
        email_hash: "h_9f3a",
        country: "US",
        loyalty_tier: "silver",
      },
      {
        id: 502,
        created_at: "2026-01-12 12:30:00",
        updated_at: "2026-02-12 08:03:00",
        email_hash: "h_7c10",
        country: "US",
        loyalty_tier: "gold",
      },
    ],
  },
  {
    database: "db_stage",
    schema: "s1",
    name: "inventory_levels",
    columns: ["id", "created_at", "updated_at", "sku", "warehouse_id", "qty_on_hand"],
    sampleRows: [
      {
        id: 9001,
        created_at: "2026-02-12 07:50:00",
        updated_at: "2026-02-12 08:00:00",
        sku: "SKU-001",
        warehouse_id: "WH-1",
        qty_on_hand: 42,
      },
      {
        id: 9002,
        created_at: "2026-02-12 07:52:00",
        updated_at: "2026-02-12 08:05:00",
        sku: "SKU-002",
        warehouse_id: "WH-1",
        qty_on_hand: 7,
      },
    ],
  },
];

const MODEL_TABLES: MockTable[] = [
  {
    database: "db_data_model",
    schema: "dbo",
    name: "orders",
    columns: ["id", "created_at", "updated_at", "customer_id", "order_total", "currency", "order_status", "demo_note"],
    sampleRows: [
      {
        id: 1001,
        created_at: "2026-02-12 07:55:00",
        updated_at: "2026-02-12 08:00:00",
        customer_id: 501,
        order_total: 79.99,
        currency: "USD",
        order_status: "paid",
        demo_note: "ok",
      },
      {
        id: 1002,
        created_at: "2026-02-12 08:02:00",
        updated_at: "2026-02-12 08:05:00",
        customer_id: 502,
        order_total: 19.5,
        currency: "USD",
        order_status: "shipped",
        demo_note: "ok",
      },
    ],
  },
  {
    database: "db_data_model",
    schema: "dbo",
    name: "customers",
    columns: ["id", "created_at", "updated_at", "email_hash", "country", "loyalty_tier", "demo_note"],
    sampleRows: [
      {
        id: 501,
        created_at: "2026-01-10 10:00:00",
        updated_at: "2026-02-12 08:01:00",
        email_hash: "h_9f3a",
        country: "US",
        loyalty_tier: "silver",
        demo_note: "ok",
      },
      {
        id: 502,
        created_at: "2026-01-12 12:30:00",
        updated_at: "2026-02-12 08:03:00",
        email_hash: "h_7c10",
        country: "US",
        loyalty_tier: "gold",
        demo_note: "ok",
      },
    ],
  },
  {
    database: "db_data_model",
    schema: "s1",
    name: "campaign_metrics",
    columns: ["id", "created_at", "updated_at", "campaign_id", "impressions", "clicks", "spend", "demo_note"],
    sampleRows: [
      {
        id: 7001,
        created_at: "2026-02-12 07:00:00",
        updated_at: "2026-02-12 08:00:00",
        campaign_id: "CAMP-01",
        impressions: 1200,
        clicks: 34,
        spend: 18.75,
        demo_note: "ok",
      },
      {
        id: 7002,
        created_at: "2026-02-12 07:05:00",
        updated_at: "2026-02-12 08:05:00",
        campaign_id: "CAMP-02",
        impressions: 800,
        clicks: 20,
        spend: 11.4,
        demo_note: "ok",
      },
    ],
  },
];

const RAW_MOCK_CONNECTIONS: MockConnection[] = [
  {
    id: "demo-sqlserver-retail",
    name: "demo_sqlserver_retail",
    engine: "SQL Server (mock)",
    host: "demo-sql01.demo.local",
    databases: [
      {
        name: "db_stage",
        schemas: [
          {
            name: "dbo",
            tables: STAGE_TABLES.filter((t) => t.database === "db_stage" && t.schema === "dbo"),
          },
          {
            name: "s1",
            tables: STAGE_TABLES.filter((t) => t.database === "db_stage" && t.schema === "s1"),
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
            name: "s1",
            tables: MODEL_TABLES.filter((t) => t.database === "db_data_model" && t.schema === "s1"),
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
