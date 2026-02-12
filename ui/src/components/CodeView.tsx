"use client";

import { useMemo, useState } from "react";
import {
  MockConnection,
  MockDatabase,
  MockSchema,
  MockTable,
  buildInfoSchemaColumnsQuery,
  buildInfoSchemaTablesQuery,
  executeMockQuery,
} from "@/lib/sql-explorer-mock";
import { useSqlExplorerStore } from "@/lib/sql-explorer-store";

function SchemaBrowser({
  connection,
  connectionId,
  setQuery,
  activeTable,
  setActiveTable,
}: {
  connection: MockConnection | null;
  connectionId: string;
  setQuery: (q: string) => void;
  activeTable: MockTable | null;
  setActiveTable: (t: MockTable | null) => void;
}) {
  const initialConnection = connection;
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
      {/* key is used intentionally to reset expansion state when connection changes */}
      <span className="hidden" data-connection-key={connectionId} />
    </div>
  );
}

export function CodeView() {
  const connections = useSqlExplorerStore((s) => s.connections);
  const connectionId = useSqlExplorerStore((s) => s.activeConnectionId);
  const setConnectionId = useSqlExplorerStore((s) => s.setActiveConnectionId);
  const addConnection = useSqlExplorerStore((s) => s.addConnection);
  const updateConnection = useSqlExplorerStore((s) => s.updateConnection);
  const removeConnection = useSqlExplorerStore((s) => s.removeConnection);

  const [activeTable, setActiveTable] = useState<MockTable | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [query, setQuery] = useState("SELECT table_catalog, table_schema, table_name FROM information_schema.tables ORDER BY 1,2,3;");
  const [result, setResult] = useState(() => ({
    columns: [] as string[],
    rows: [] as Array<Record<string, string | number>>,
    notice: "Ready",
  }));

  const connection = useMemo<MockConnection | null>(
    () => connections.find((c) => c.id === connectionId) ?? connections[0] ?? null,
    [connectionId, connections]
  );

  const runQuery = () => {
    if (!connection) return;
    setResult(executeMockQuery(connection, query));
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
          <div className="flex items-center gap-2">
            <select
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              className="flex-1 border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs"
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowManage(true)}
              className="px-2.5 py-1.5 text-[11px] rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer"
              title="Manage mock connections"
            >
              Manage
            </button>
          </div>
          {connection && (
            <p className="text-[10px] text-text-tertiary mt-1">
              {connection.engine} · {connection.host}
            </p>
          )}
        </div>

        <SchemaBrowser
          key={connectionId}
          connection={connection}
          connectionId={connectionId}
          setQuery={setQuery}
          activeTable={activeTable}
          setActiveTable={setActiveTable}
        />

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

      {showManage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-lg border border-sidebar-border bg-surface shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-sidebar-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Manage connections (mock)</h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  This is scaffold-only. Connections share the same mock schema dataset.
                </p>
              </div>
              <button
                onClick={() => setShowManage(false)}
                className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
                  Connections ({connections.length})
                </span>
                <button
                  type="button"
                  onClick={() => addConnection({ name: `demo_connection_${connections.length + 1}` })}
                  className="px-3 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent/85 cursor-pointer"
                >
                  Add connection
                </button>
              </div>

              <div className="border border-sidebar-border rounded-md overflow-hidden bg-background">
                <div className="grid grid-cols-[1fr_1fr_90px] gap-2 px-3 py-2 bg-surface-hover/40 text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
                  <span>Name</span>
                  <span>Host</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="max-h-[340px] overflow-auto">
                  {connections.map((c) => {
                    const isActive = c.id === connectionId;
                    const canRemove = connections.length > 1;
                    return (
                      <div
                        key={c.id}
                        className={`grid grid-cols-[1fr_1fr_90px] gap-2 px-3 py-2 border-t border-sidebar-border/60 items-center ${
                          isActive ? "bg-accent/5" : ""
                        }`}
                      >
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateConnection(c.id, { name: e.target.value })}
                          className="w-full border border-sidebar-border rounded-md px-2 py-1 bg-background text-foreground text-xs"
                          spellCheck={false}
                        />
                        <input
                          type="text"
                          value={c.host}
                          onChange={(e) => updateConnection(c.id, { host: e.target.value })}
                          className="w-full border border-sidebar-border rounded-md px-2 py-1 bg-background text-foreground text-xs font-mono"
                          spellCheck={false}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setConnectionId(c.id)}
                            className={`text-[11px] px-2 py-1 rounded border border-sidebar-border cursor-pointer ${
                              isActive
                                ? "bg-accent text-white border-accent"
                                : "text-text-secondary hover:bg-surface-hover"
                            }`}
                          >
                            {isActive ? "Active" : "Use"}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeConnection(c.id)}
                            disabled={!canRemove}
                            className={`text-[11px] px-2 py-1 rounded border border-sidebar-border ${
                              canRemove
                                ? "text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer"
                                : "text-text-tertiary cursor-not-allowed"
                            }`}
                            title={canRemove ? "Remove" : "Keep at least 1 connection"}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-sidebar-border flex items-center justify-end bg-surface">
              <button
                onClick={() => setShowManage(false)}
                className="px-3 py-1.5 text-xs rounded-md border border-sidebar-border text-text-secondary hover:bg-surface-hover cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
