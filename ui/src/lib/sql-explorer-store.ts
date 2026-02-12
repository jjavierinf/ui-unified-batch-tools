import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MockConnection } from "./sql-explorer-mock";
import { MOCK_CONNECTIONS } from "./sql-explorer-mock";

interface SqlExplorerStore {
  connections: MockConnection[];
  activeConnectionId: string;
  setActiveConnectionId: (id: string) => void;
  addConnection: (input?: { name?: string; host?: string }) => string;
  updateConnection: (id: string, patch: { name?: string; host?: string }) => void;
  removeConnection: (id: string) => void;
  resetToDefaults: () => void;
}

function cloneTemplateConnection(template: MockConnection, patch?: { name?: string; host?: string }): MockConnection {
  // Clone (preserve mock schema/table dataset) but replace identity fields.
  return {
    ...template,
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: patch?.name ?? `demo_connection_${Math.floor(Math.random() * 100)}`,
    host: patch?.host ?? template.host,
  };
}

const DEFAULT_CONNECTIONS = MOCK_CONNECTIONS;
const DEFAULT_ACTIVE = DEFAULT_CONNECTIONS[0]?.id ?? "";

export const useSqlExplorerStore = create<SqlExplorerStore>()(
  persist(
    (set, get) => ({
      connections: DEFAULT_CONNECTIONS,
      activeConnectionId: DEFAULT_ACTIVE,

      setActiveConnectionId: (id) => set({ activeConnectionId: id }),

      addConnection: (input) => {
        const state = get();
        const template =
          state.connections.find((c) => c.id === state.activeConnectionId) ??
          state.connections[0] ??
          DEFAULT_CONNECTIONS[0];
        if (!template) return "";
        const next = cloneTemplateConnection(template, input);
        set({
          connections: [...state.connections, next],
          activeConnectionId: next.id,
        });
        return next.id;
      },

      updateConnection: (id, patch) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      removeConnection: (id) =>
        set((state) => {
          const next = state.connections.filter((c) => c.id !== id);
          const fallback = next[0]?.id ?? "";
          const activeConnectionId =
            state.activeConnectionId === id ? fallback : state.activeConnectionId;
          return { connections: next, activeConnectionId };
        }),

      resetToDefaults: () =>
        set({
          connections: DEFAULT_CONNECTIONS,
          activeConnectionId: DEFAULT_ACTIVE,
        }),
    }),
    { name: "sql-explorer-store-v1" }
  )
);

