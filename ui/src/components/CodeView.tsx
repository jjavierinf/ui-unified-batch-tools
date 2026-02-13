"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useSafetyStore } from "@/lib/safety-store";
import { Breadcrumb } from "./Breadcrumb";
import { BottomConsole } from "./BottomConsole";

function Icon({
  kind,
  className,
}: {
  kind: "connection" | "database" | "schema" | "table";
  className?: string;
}) {
  // Minimal DBeaver-like glyphs (no external icon lib).
  if (kind === "table") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M3 6h18" />
        <path d="M3 12h18" />
        <path d="M3 18h18" />
        <path d="M6 6v12" />
        <path d="M12 6v12" />
        <path d="M18 6v12" />
      </svg>
    );
  }
  if (kind === "schema") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    );
  }
  if (kind === "database") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </svg>
    );
  }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SqlServerLogo({ size = 20 }: { size?: number }) {
  // Simplified SQL Server logo — red diamond shape with database cylinder
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Red background */}
      <rect x="4" y="4" width="56" height="56" rx="8" fill="#CC2927" />
      {/* Database cylinder */}
      <ellipse cx="32" cy="20" rx="14" ry="5" fill="#fff" fillOpacity=".9" />
      <path d="M18 20v24c0 2.8 6.3 5 14 5s14-2.2 14-5V20" fill="#fff" fillOpacity=".35" />
      <ellipse cx="32" cy="44" rx="14" ry="5" fill="#fff" fillOpacity=".5" />
      <path d="M18 20v24c0 2.8 6.3 5 14 5s14-2.2 14-5V20" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M18 28c0 2.8 6.3 5 14 5s14-2.2 14-5" stroke="#fff" strokeWidth="1.5" strokeOpacity=".6" fill="none" />
      <path d="M18 36c0 2.8 6.3 5 14 5s14-2.2 14-5" stroke="#fff" strokeWidth="1.5" strokeOpacity=".6" fill="none" />
    </svg>
  );
}

function PostgresLogo({ size = 20 }: { size?: number }) {
  // Slonik — elephant head profile, optimized for small sizes
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="56" height="56" rx="8" fill="#336791" />
      {/* Elephant head profile — facing left */}
      <path
        d="M44 16c-2-3-6-5-10-5-7 0-13 5-13 12 0 3 1 5 3 7l-5 3c-1 .7-.5 2 .6 2h4
           l1 8c.2 1.5 1.5 2.5 3 2.5h2l.5-7h6l.5 7h2c1.5 0 2.8-1 3-2.5l1-8h3
           c1.2 0 1.8-1.2 1-2l-4-4c1.5-2 2.5-4.5 2.5-7 0-2.5-.7-4.5-1.1-5z"
        fill="white"
      />
      {/* Ear — big curved shape on right side of head */}
      <path
        d="M40 14c4 2 6 6 6 10-1 3-3 4-5 3"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Eye */}
      <circle cx="27" cy="22" r="2" fill="#336791" />
      {/* Trunk curling down */}
      <path
        d="M21 30c-2 2-4 6-3 10 .3 1 1 1.5 1.5 1"
        stroke="#336791"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function GenericDbLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="56" height="56" rx="8" fill="#6B7280" />
      <ellipse cx="32" cy="18" rx="14" ry="5" fill="#fff" fillOpacity=".8" />
      <path d="M18 18v28c0 2.8 6.3 5 14 5s14-2.2 14-5V18" fill="#fff" fillOpacity=".25" />
      <path d="M18 18v28c0 2.8 6.3 5 14 5s14-2.2 14-5V18" stroke="#fff" strokeWidth="2" fill="none" />
      <path d="M18 27c0 2.8 6.3 5 14 5s14-2.2 14-5" stroke="#fff" strokeWidth="1.5" strokeOpacity=".5" fill="none" />
      <path d="M18 36c0 2.8 6.3 5 14 5s14-2.2 14-5" stroke="#fff" strokeWidth="1.5" strokeOpacity=".5" fill="none" />
    </svg>
  );
}

function EngineIcon({
  engine,
  className,
}: {
  engine: string | undefined;
  className?: string;
}) {
  const e = (engine ?? "").toLowerCase();

  if (e.includes("sql server") || e.includes("mssql")) {
    return (
      <span className={`inline-flex shrink-0 ${className ?? ""}`} title={engine}>
        <SqlServerLogo />
      </span>
    );
  }

  if (e.includes("postgres")) {
    return (
      <span className={`inline-flex shrink-0 ${className ?? ""}`} title={engine}>
        <PostgresLogo />
      </span>
    );
  }

  return (
    <span className={`inline-flex shrink-0 ${className ?? ""}`} title={engine}>
      <GenericDbLogo />
    </span>
  );
}

function SchemaBrowser({
  connection,
  connectionId,
  setQuery,
  activeDb,
  setActiveDb,
  activeSchemaKey,
  setActiveSchemaKey,
  activeTable,
  setActiveTable,
  filter,
}: {
  connection: MockConnection | null;
  connectionId: string;
  setQuery: (q: string) => void;
  activeDb: string | null;
  setActiveDb: (db: string | null) => void;
  activeSchemaKey: string | null;
  setActiveSchemaKey: (k: string | null) => void;
  activeTable: MockTable | null;
  setActiveTable: (t: MockTable | null) => void;
  filter: string;
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
    setActiveDb(db.name);
    setActiveSchemaKey(`${db.name}.${schema.name}`);
    setQuery(buildInfoSchemaTablesQuery(db.name, schema.name));
  };

  const openTableColumnsQuery = (table: MockTable) => {
    setActiveTable(table);
    setActiveDb(table.database);
    setActiveSchemaKey(`${table.database}.${table.schema}`);
    setQuery(buildInfoSchemaColumnsQuery(table.database, table.schema, table.name));
  };

  const q = filter.trim().toLowerCase();
  const matches = (s: string) => (q ? s.toLowerCase().includes(q) : true);

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {connection?.databases
        .filter((db) => {
          if (!q) return true;
          if (matches(db.name)) return true;
          for (const schema of db.schemas) {
            if (matches(schema.name)) return true;
            for (const table of schema.tables) if (matches(table.name)) return true;
          }
          return false;
        })
        .map((db) => (
        <div key={db.name} className="mb-1">
          <div className="flex items-center gap-1 px-1">
            <button
              type="button"
              onClick={() => toggleDb(db.name)}
              className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-foreground hover:bg-surface-hover cursor-pointer"
              title={expandedDbs.has(db.name) ? "Collapse" : "Expand"}
              aria-label={expandedDbs.has(db.name) ? "Collapse database" : "Expand database"}
            >
              {expandedDbs.has(db.name) ? "▾" : "▸"}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveDb(db.name);
                setActiveSchemaKey(null);
                setActiveTable(null);
              }}
              className={`flex-1 text-left px-2 py-1 text-xs rounded cursor-pointer ${
                activeDb === db.name && !activeSchemaKey && !activeTable
                  ? "bg-accent/10 text-accent"
                  : "text-foreground hover:bg-surface-hover"
              }`}
              title="Select database"
            >
              <span className="inline-flex items-center gap-2">
                <Icon kind="database" className={activeDb === db.name ? "text-accent" : "text-text-tertiary"} />
                {db.name}
              </span>
            </button>
          </div>
          {expandedDbs.has(db.name) &&
            db.schemas
              .filter((schema) => {
                if (!q) return true;
                if (matches(schema.name)) return true;
                for (const table of schema.tables) if (matches(table.name)) return true;
                return false;
              })
              .map((schema) => {
              const schemaKey = `${db.name}.${schema.name}`;
              return (
                <div key={schemaKey} className="ml-3">
                  <div className="flex items-center gap-1 px-1">
                    <button
                      type="button"
                      onClick={() => toggleSchema(db.name, schema.name)}
                      className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-foreground hover:bg-surface-hover cursor-pointer"
                      title={expandedSchemas.has(schemaKey) ? "Collapse" : "Expand"}
                      aria-label={expandedSchemas.has(schemaKey) ? "Collapse schema" : "Expand schema"}
                    >
                      {expandedSchemas.has(schemaKey) ? "▾" : "▸"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openSchemaTablesQuery(db, schema)}
                      className={`flex-1 text-left px-2 py-1 text-xs rounded cursor-pointer ${
                        activeSchemaKey === schemaKey && !activeTable
                          ? "bg-accent/10 text-accent"
                          : "text-text-secondary hover:bg-surface-hover"
                      }`}
                      title="List tables (INFORMATION_SCHEMA)"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon kind="schema" className={activeSchemaKey === schemaKey && !activeTable ? "text-accent" : "text-text-tertiary"} />
                        {schema.name}
                      </span>
                    </button>
                  </div>
                  {expandedSchemas.has(schemaKey) &&
                    schema.tables
                      .filter((table) => (q ? matches(table.name) : true))
                      .map((table) => {
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
                          title="List columns (INFORMATION_SCHEMA)"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon kind="table" className={active ? "text-accent" : "text-text-tertiary"} />
                            {table.name}
                          </span>
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
  const resetConnections = useSqlExplorerStore((s) => s.resetToDefaults);
  const safety = useSafetyStore((s) => s.config);

  const [activeDb, setActiveDb] = useState<string | null>(null);
  const [activeSchemaKey, setActiveSchemaKey] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<MockTable | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [navFilter, setNavFilter] = useState("");
  const [query, setQuery] = useState("SELECT table_catalog, table_schema, table_name FROM information_schema.tables ORDER BY 1,2,3;");
  const [result, setResult] = useState(() => ({
    columns: [] as string[],
    rows: [] as Array<Record<string, string | number>>,
    notice: "Ready",
  }));
  const [policyBlock, setPolicyBlock] = useState<null | {
    title: string;
    detail: string;
    whatToDo: string;
  }>(null);
  const [lastMetrics, setLastMetrics] = useState<{ idlePct: number; estRuntimeMs: number } | null>(null);

  // Resizable sidebar
  const MIN_SIDEBAR = 220;
  const MAX_SIDEBAR = 500;
  const [sidebarW, setSidebarW] = useState(310);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSidebarW(Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, ev.clientX - rect.left)));
    };
    const stopResize = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, []);

  const startResize = () => {
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const connection = useMemo<MockConnection | null>(
    () => connections.find((c) => c.id === connectionId) ?? connections[0] ?? null,
    [connectionId, connections]
  );

  const breadcrumbSegments = useMemo(() => {
    const segs: Array<{ label: string; onClick?: () => void }> = [];
    if (connection) {
      segs.push({ label: connection.name, onClick: () => { setActiveDb(null); setActiveSchemaKey(null); setActiveTable(null); } });
    }
    if (activeDb) {
      segs.push({ label: activeDb, onClick: () => { setActiveSchemaKey(null); setActiveTable(null); } });
    }
    if (activeSchemaKey) {
      const schemaName = activeSchemaKey.split(".")[1] ?? activeSchemaKey;
      segs.push({ label: schemaName, onClick: () => { setActiveTable(null); } });
    }
    if (activeTable) {
      segs.push({ label: activeTable.name });
    }
    return segs;
  }, [connection, activeDb, activeSchemaKey, activeTable]);

  const runQuery = () => {
    if (!connection) return;

    const estRuntimeMs = Math.min(120_000, 300 + query.length * 14);
    const hash = Array.from(connectionId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const idlePct = 20 + (hash % 61); // 20..80 (deterministic)
    setLastMetrics({ idlePct, estRuntimeMs });

    if (idlePct < safety.minIdlePctExplorer) {
      setPolicyBlock({
        title: "Blocked by Safety guardrails (mock)",
        detail: `Idle resources ${idlePct}% is below the team minimum (${safety.minIdlePctExplorer}%).`,
        whatToDo: "Try later, or ask a Team Leader to lower the minimum idle threshold for SQL Explorer.",
      });
      setResult({ columns: [], rows: [], notice: "Blocked (policy)" });
      return;
    }

    if (estRuntimeMs > safety.maxRuntimeMsExplorer) {
      setPolicyBlock({
        title: "Blocked by Safety guardrails (mock)",
        detail: `Estimated runtime ${estRuntimeMs}ms exceeds the team max (${safety.maxRuntimeMsExplorer}ms).`,
        whatToDo: "Reduce the query scope (filters/partitions), add LIMIT for exploration, or ask a Team Leader to adjust the max runtime.",
      });
      setResult({ columns: [], rows: [], notice: "Blocked (policy)" });
      return;
    }

    setPolicyBlock(null);
    setResult(executeMockQuery(connection, query));
  };

  return (
    <div ref={containerRef} className="flex flex-1 min-h-0 bg-background">
      <aside className="shrink-0 border-r border-sidebar-border bg-surface flex flex-col" style={{ width: `${sidebarW}px` }}>
        <div className="px-3 py-2 border-b border-sidebar-border">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
            Database Navigator
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-[10px] text-text-tertiary">
                  Connection
                </label>
                {connection && (
                  <span className="text-[10px] text-text-tertiary font-mono truncate" title={connection.host}>
                    {connection.host}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <EngineIcon engine={connection?.engine} />
                <select
                  value={connectionId}
                  onChange={(e) => setConnectionId(e.target.value)}
                  className="flex-1 min-w-0 border border-sidebar-border rounded-md px-2 py-1.5 bg-background text-foreground text-xs truncate"
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
                  className="shrink-0 p-1.5 rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer"
                  title="Manage connections"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 relative">
            <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={navFilter}
              onChange={(e) => setNavFilter(e.target.value)}
              placeholder="Filter db/schema/table..."
              className="w-full rounded-md border border-sidebar-border bg-background pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            {navFilter.trim() && (
              <button
                type="button"
                onClick={() => setNavFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground cursor-pointer"
                title="Clear filter"
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>

        <SchemaBrowser
          key={connectionId}
          connection={connection}
          connectionId={connectionId}
          setQuery={setQuery}
          activeDb={activeDb}
          setActiveDb={setActiveDb}
          activeSchemaKey={activeSchemaKey}
          setActiveSchemaKey={setActiveSchemaKey}
          activeTable={activeTable}
          setActiveTable={setActiveTable}
          filter={navFilter}
        />

        <div className="p-2 border-t border-sidebar-border">
          <p className="text-[10px] text-text-tertiary">
            Hint: click schema/table to prep `INFORMATION_SCHEMA` queries
          </p>
        </div>
      </aside>

      <div
        className="w-1 shrink-0 cursor-col-resize bg-sidebar-border/30 hover:bg-accent/50 transition-colors"
        onPointerDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      />

      <section className="flex-1 min-w-0 flex flex-col">
        <Breadcrumb segments={breadcrumbSegments} />
        <div className="px-4 py-2 border-b border-sidebar-border bg-surface flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon kind="connection" className="text-text-tertiary" />
              <p className="text-xs font-medium text-foreground">
                {connection?.name ?? "No connection selected"}
              </p>
              {connection && (
                <span className="inline-flex items-center gap-1.5 text-[10px] text-text-tertiary px-2 py-0.5 rounded-full border border-sidebar-border bg-surface-hover/40">
                  <EngineIcon engine={connection.engine} />
                  <span>{connection.engine}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-text-tertiary mt-0.5">
              Mock query runner (aligned to INFORMATION_SCHEMA)
            </p>
            <p className="text-[10px] text-text-tertiary mt-1">
              Selection:{" "}
              <span className="text-text-secondary">
                {activeTable
                  ? `${activeTable.database}.${activeTable.schema}.${activeTable.name}`
                  : activeSchemaKey
                    ? activeSchemaKey
                    : activeDb
                      ? activeDb
                      : "none"}
              </span>
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
          {(() => {
            const isSelect = /^\s*select\b/i.test(query);
            const hasLimitLike = /\blimit\b|\btop\b/i.test(query);
            if (!isSelect || hasLimitLike) return null;
            return (
              <div className="mt-2 rounded-md border border-sidebar-border bg-surface px-3 py-2">
                <p className="text-[11px] text-text-secondary">
                  <span className="font-medium text-badge-pending">LIMIT {safety.defaultLimitRowsExplorer}</span>{" "}
                  rows — applied implicitly to SELECT queries without an explicit LIMIT/TOP.
                </p>
              </div>
            );
          })()}
        </div>

        {policyBlock && (
          <div className="mx-4 my-3 rounded-lg border border-sidebar-border bg-surface p-4 shrink-0">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-badge-pending">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{policyBlock.title}</p>
                <p className="text-xs text-text-secondary mt-1">{policyBlock.detail}</p>
                <p className="text-xs text-text-tertiary mt-2">
                  <span className="font-semibold text-text-secondary">What to do:</span>{" "}
                  {policyBlock.whatToDo}
                </p>
              </div>
            </div>
          </div>
        )}

        <BottomConsole columns={result.columns} rows={result.rows} notice={result.notice} />
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resetConnections()}
                  className="px-2.5 py-1.5 text-[11px] rounded-md border border-sidebar-border text-text-secondary hover:text-foreground hover:bg-surface-hover cursor-pointer"
                  title="Reset to seeded demo connections"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowManage(false)}
                  className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
                  Connections ({connections.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    addConnection({
                      name: `demo_connection_${connections.length + 1}`,
                      host: "mock-sql.custom.internal",
                    })
                  }
                  className="px-3 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent/85 cursor-pointer"
                >
                  Add connection
                </button>
              </div>

              {connections.length === 0 && (
                <div className="rounded-md border border-sidebar-border bg-background p-3">
                  <p className="text-sm text-foreground font-medium">No connections</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Add a connection to start browsing schemas, or reset to demo defaults.
                  </p>
                </div>
              )}

              <div className="border border-sidebar-border rounded-md overflow-hidden bg-background">
                <div className="max-h-[400px] overflow-auto divide-y divide-sidebar-border/60">
                  {connections.map((c) => {
                    const isActive = c.id === connectionId;
                    const canRemove = connections.length > 1;
                    const nameOk = c.name.trim().length > 0;
                    const hostOk = c.host.trim().length > 0;
                    return (
                      <div
                        key={c.id}
                        className={`px-4 py-3 ${isActive ? "bg-accent/5" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-accent" : "bg-text-tertiary/40"}`} />
                            <span className="text-xs font-medium text-foreground truncate">{c.name || "Unnamed"}</span>
                            <span className="text-[10px] text-text-tertiary font-mono truncate">{c.host}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
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
                              onClick={() => {
                                if (isActive) {
                                  const ok = window.confirm(
                                    "Remove the active connection? (Scaffold-only: this does not affect any real DB.)"
                                  );
                                  if (!ok) return;
                                }
                                removeConnection(c.id);
                              }}
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
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-text-tertiary mb-0.5">Name</label>
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => updateConnection(c.id, { name: e.target.value })}
                              className={`w-full border rounded-md px-2 py-1.5 bg-background text-foreground text-xs ${
                                nameOk ? "border-sidebar-border" : "border-red-500"
                              }`}
                              spellCheck={false}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-tertiary mb-0.5">Host</label>
                            <input
                              type="text"
                              value={c.host}
                              onChange={(e) => updateConnection(c.id, { host: e.target.value })}
                              className={`w-full border rounded-md px-2 py-1.5 bg-background text-foreground text-xs font-mono ${
                                hostOk ? "border-sidebar-border" : "border-red-500"
                              }`}
                              spellCheck={false}
                            />
                          </div>
                        </div>
                        {(!nameOk || !hostOk) && (
                          <p className="text-[11px] text-red-400 mt-1">
                            {!nameOk ? "Name is required." : ""} {!hostOk ? "Host is required." : ""}
                          </p>
                        )}
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
