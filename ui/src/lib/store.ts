import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SqlFile, Environment } from "./types";
import { initialFiles } from "./mock-data";

interface EditorStore {
  files: Record<string, SqlFile>;
  selectedFile: string | null;
  expandedFolders: Set<string>;
  darkMode: boolean;
  environment: Environment;
  diffCollapsed: boolean;

  selectFile: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  saveFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  toggleDarkMode: () => void;
  toggleDiffPanel: () => void;
  setEnvironment: (env: Environment) => void;
  createFile: (path: string) => void;
  submitFile: (path: string) => void;
  approveFile: (path: string) => void;
  rejectFile: (path: string) => void;
  resetToDefaults: () => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      files: initialFiles,
      selectedFile: null,
      expandedFolders: new Set<string>(),
      darkMode: false,
      environment: "dev",
      diffCollapsed: false,

      selectFile: (path) =>
        set({ selectedFile: path }),

      updateContent: (path, content) =>
        set((state) => ({
          files: {
            ...state.files,
            [path]: {
              ...state.files[path],
              content,
              // Auto-reset status to draft on edit
              status: "draft",
            },
          },
        })),

      saveFile: (path) =>
        set((state) => ({
          files: {
            ...state.files,
            [path]: {
              ...state.files[path],
              savedContent: state.files[path].content,
            },
          },
        })),

      toggleFolder: (path) =>
        set((state) => {
          const next = new Set(state.expandedFolders);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return { expandedFolders: next };
        }),

      toggleDarkMode: () =>
        set((state) => {
          const next = !state.darkMode;
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next);
          }
          return { darkMode: next };
        }),

      setEnvironment: (env) =>
        set({ environment: env }),

      toggleDiffPanel: () =>
        set((state) => ({ diffCollapsed: !state.diffCollapsed })),

      createFile: (path) =>
        set((state) => ({
          files: {
            ...state.files,
            [path]: { content: "", savedContent: "", status: "draft" },
          },
          selectedFile: path,
        })),

      submitFile: (path) =>
        set((state) => {
          const env = state.environment;
          const file = state.files[path];
          if (!file) return state;
          return {
            files: {
              ...state.files,
              [path]: {
                ...file,
                status: env === "dev" ? "submitted" : "pending_approval",
                submittedAt: new Date().toISOString(),
              },
            },
          };
        }),

      approveFile: (path) =>
        set((state) => {
          const file = state.files[path];
          if (!file || file.status !== "pending_approval") return state;
          return {
            files: {
              ...state.files,
              [path]: {
                ...file,
                status: "approved",
                savedContent: file.content,
                approvedAt: new Date().toISOString(),
              },
            },
          };
        }),

      rejectFile: (path) =>
        set((state) => {
          const file = state.files[path];
          if (!file || file.status !== "pending_approval") return state;
          return {
            files: {
              ...state.files,
              [path]: {
                ...file,
                status: "draft",
              },
            },
          };
        }),

      resetToDefaults: () =>
        set({
          files: initialFiles,
          selectedFile: null,
          expandedFolders: new Set<string>(),
          darkMode: false,
          environment: "dev",
          diffCollapsed: false,
        }),
    }),
    {
      name: "editor-store-v2",
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          if (parsed?.state?.expandedFolders) {
            parsed.state.expandedFolders = new Set(
              parsed.state.expandedFolders
            );
          }
          return parsed;
        },
        setItem: (name, value) => {
          const serializable = {
            ...value,
            state: {
              ...value.state,
              expandedFolders: Array.from(
                value.state.expandedFolders || []
              ),
            },
          };
          localStorage.setItem(name, JSON.stringify(serializable));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
