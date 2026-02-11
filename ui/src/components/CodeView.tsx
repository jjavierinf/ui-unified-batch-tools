"use client";

import { useMemo, useState } from "react";
import {
  MOCK_CONNECTIONS,
  MockConnection,
  MockDatabase,
  MockSchema,
  MockTable,
  buildInfoSchemaColumnsQuery,
  buildInfoSchemaTablesQuery,
  executeMockQuery,
} from "@/lib/sql-explorer-mock";

export function CodeView() {
  const initialConnection = MOCK_CONNECTIONS[0] ?? null;
  const [connectionId, setConnectionId] = useState(initialConnection?.id ?? "");
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(
    () => new Set(initialConnection?.databases.map((db) => db.name) ?? [])
  );
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    () =>
      new Set(
        initialConnection?.databases.flatMap((db) =>
          db.schemas.map((schema) => `${db.name}.${schema.name}`)
        ) ?? []
      )
  );
  const [activeTable, setActiveTable] = useState<MockTable | null>(null);
  const [query, setQuery] = useState("SELECT table_catalog, table_schema, table_name FROM information_schema.tables ORDER BY 1,2,3;");
  const [result, setResult] = useState(() => ({
    columns: [] as string[],
    rows: [] as Array<Record<string, string | number>>,
    notice: "Ready",
  }));

  const connection = useMemo<MockConnection | null>(
    () => MOCK_CONNECTIONS.find((c) => c.id === connectionId) ?? null,
    [connectionId]
  );

  const handleConnectionChange = (nextId: string) => {
    setConnectionId(nextId);
    const nextConnection = MOCK_CONNECTIONS.find((c) => c.id === nextId);
    if (!nextConnection) return;
    setExpandedDbs(new Set(nextConnection.databases.map((db) => db.name)));
    setExpandedSchemas(
      new Set(
        nextConnection.databases.flatMap((db) =>
          db.schemas.map((schema) => `${db.name}.${schema.name}`)
        )
      )
    );
  };

  const runQuery = () => {
    if (!connection) return;
    setResult(executeMockQuery(connection, query));
  };

  const toggleDb = (dbName: string) => {
    setExpandedDbs((prev) => {
      const next = new Set(prev);
      if (next.has(dbName)) next.delete(dbName);
      else next.add(dbName);
      return next;
    });
  };

  const toggleSchema = (database: string, schema: string) => {
    const key = `${database}.${schema}`;
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openSchemaTablesQuery = (db: MockDatabase, schema: MockSchema) => {
    setActiveTable(null);
    setQuery(buildInfoSchemaTablesQuery(db.name, schema.name));
  };

  const openTableColumnsQuery = (table: MockTable) => {
    setActiveTable(table);
    setQuery(buildInfoSchemaColumnsQuery(table.database, table.schema, table.name));
  };

  return (
    <div className="flex flex-1 min-h-0 bg-background">
      <aside className="w-[310px] shrink-0 border-r border-sidebar-border bg-surface flex flex-col">
        <div className="px-3 py-2 border-b border-sidebar-border">
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary">SQL Explorer</p>
          <p className="text-xs text-foreground mt-0.5">DBeaver-style schema browser (mock)</p>
        </div>
        <div className="px-3 py-2 border-b border-sidebar-border">
          <label className="block text-[10px] text-text-tertiary mb-1">Connection</label>
          <select
            value={connectionId}
            onChange={(e) => handleConnectionChange(e.target.value)}
            className="w-full border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs"
          >
            {MOCK_CONNECTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {connection && (
            <p className="text-[10px] text-text-tertiary mt-1">
              {connection.engine} · {connection.host}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {connection?.databases.map((db) => (
            <div key={db.name} className="mb-1">
              <button
                onClick={() => toggleDb(db.name)}
                className="w-full text-left px-2 py-1 text-xs text-foreground hover:bg-surface-hover rounded cursor-pointer"
              >
                {expandedDbs.has(db.name) ? "▾" : "▸"} {db.name}
              </button>
              {expandedDbs.has(db.name) &&
                db.schemas.map((schema) => {
                  const schemaKey = `${db.name}.${schema.name}`;
                  return (
                    <div key={schemaKey} className="ml-3">
                      <button
                        onClick={() => {
                          toggleSchema(db.name, schema.name);
                          openSchemaTablesQuery(db, schema);
                        }}
                        className="w-full text-left px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover rounded cursor-pointer"
                      >
                        {expandedSchemas.has(schemaKey) ? "▾" : "▸"} {schema.name}
                      </button>
                      {expandedSchemas.has(schemaKey) &&
                        schema.tables.map((table) => {
                          const key = `${table.database}.${table.schema}.${table.name}`;
                          const active =
                            activeTable &&
                            activeTable.database === table.database &&
                            activeTable.schema === table.schema &&
                            activeTable.name === table.name;
                          return (
                            <button
                              key={key}
                              onClick={() => openTableColumnsQuery(table)}
                              className={`w-full text-left ml-3 px-2 py-1 text-xs rounded cursor-pointer ${
                                active
                                  ? "bg-accent/10 text-accent"
                                  : "text-text-tertiary hover:bg-surface-hover"
                              }`}
                            >
                              {table.name}
                            </button>
                          );
                        })}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-sidebar-border">
          <p className="text-[10px] text-text-tertiary">
            Hint: query `information_schema.tables` / `information_schema.columns`
          </p>
        </div>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 py-2 border-b border-sidebar-border bg-surface flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">
              {connection?.name ?? "No connection selected"}
            </p>
            <p className="text-[10px] text-text-tertiary">
              Mock query runner (contract aligned to INFORMATION_SCHEMA)
            </p>
          </div>
          <button
            onClick={runQuery}
            className="px-3 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent/85 cursor-pointer"
          >
            Run query
          </button>
        </div>

        <div className="p-3 border-b border-sidebar-border bg-background">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            className="w-full h-[140px] resize-none rounded-md border border-sidebar-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="px-4 py-2 border-b border-sidebar-border text-[10px] text-text-tertiary">
            {result.notice}
          </div>
          {result.columns.length === 0 ? (
            <div className="p-4 text-xs text-text-tertiary">Run a query to see results.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  {result.columns.map((c) => (
                    <th key={c} className="text-left px-3 py-2 border-b border-sidebar-border font-medium text-text-secondary">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, idx) => (
                  <tr key={`row-${idx}`} className="border-b border-sidebar-border/60">
                    {result.columns.map((c) => (
                      <td key={`${idx}-${c}`} className="px-3 py-2 text-foreground align-top">
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
