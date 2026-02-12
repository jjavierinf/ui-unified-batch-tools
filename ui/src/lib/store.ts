import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SqlFile, Environment, FileStatus } from "./types";
import { initialFiles } from "./mock-data";

interface EditorStore {
  files: Record<string, SqlFile>;
  selectedFile: string | null;
  selectedFolder: string | null;
  expandedFolders: Set<string>;
  sidebarWidth: number;
  darkMode: boolean;
  environment: Environment;
  diffCollapsed: boolean;

  selectFile: (path: string) => void;
  selectFolder: (path: string) => void;
  focusFolder: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  saveFile: (path: string) => void;
  toggleFolder: (path: string) => void;
  setExpandedFolders: (folders: Set<string>) => void;
  setSidebarWidth: (width: number) => void;
  toggleDarkMode: () => void;
  toggleDiffPanel: () => void;
  setEnvironment: (env: Environment) => void;
  createFile: (path: string) => void;
  setFilesStatus: (paths: string[], status: FileStatus) => void;
  seedFiles: (files: Array<{ path: string; content: string }>) => void;
  submitFile: (path: string) => void;
  pushToDev: () => Promise<{ pushed: number }>;
  pushToProd: () => Promise<{ pushed: number; mockPrId?: string }>;
  approveFile: (path: string) => void;
  rejectFile: (path: string) => void;
  approveAll: () => void;
  rejectAll: () => void;
  resetToDefaults: () => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      files: initialFiles,
      selectedFile: null,
      selectedFolder: null,
      expandedFolders: new Set<string>(),
      sidebarWidth: 256,
      darkMode: true,
      environment: "dev",
      diffCollapsed: false,

      selectFile: (path) =>
        set({ selectedFile: path, selectedFolder: null }),

      selectFolder: (path) =>
        set({ selectedFolder: path, selectedFile: null }),

      focusFolder: (path) =>
        set({ selectedFolder: path }),

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

      saveFile: (path) => {
        const state = get();
        const file = state.files[path];
        if (!file) return;
        const nextStatus =
          file.status === "draft" || file.status === "saved_local"
            ? "saved_local"
            : file.status;
        set({
          files: {
            ...state.files,
            [path]: { ...file, savedContent: file.content, status: nextStatus },
          },
        });
        // Async git save (fire-and-forget, UI stays responsive)
        fetch("/api/git/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: path, content: file.content }),
        }).catch(() => { /* git repo may not be available */ });
      },

      toggleFolder: (path) =>
        set((state) => {
          const next = new Set(state.expandedFolders);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return { expandedFolders: next };
        }),

      setExpandedFolders: (folders) =>
        set({ expandedFolders: new Set(folders) }),

      setSidebarWidth: (width) =>
        set({ sidebarWidth: width }),

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
          selectedFolder: null,
        })),

      setFilesStatus: (paths, status) =>
        set((state) => {
          const nextFiles = { ...state.files };
          const now = new Date().toISOString();
          for (const path of paths) {
            const file = nextFiles[path];
            if (!file) continue;
            nextFiles[path] = {
              ...file,
              status,
              submittedAt:
                status === "submitted" || status === "pending_approval"
                  ? now
                  : file.submittedAt,
              approvedAt: status === "approved" ? now : file.approvedAt,
            };
          }
          return { files: nextFiles };
        }),

      seedFiles: (filesToSeed) =>
        set((state) => {
          const nextFiles = { ...state.files };
          for (const file of filesToSeed) {
            if (nextFiles[file.path]) continue;
            nextFiles[file.path] = {
              content: file.content,
              savedContent: file.content,
              status: "saved_local",
            };
          }
          return { files: nextFiles };
        }),

      submitFile: (path) => {
        const state = get();
        const env = state.environment;
        const file = state.files[path];
        if (!file) return;
        set({
          files: {
            ...state.files,
            [path]: {
              ...file,
              status: env === "dev" ? "submitted" : "pending_approval",
              submittedAt: new Date().toISOString(),
            },
          },
        });
        // Async git submit (fire-and-forget)
        const endpoint = env === "dev" ? "/api/git/submit-dev" : "/api/git/submit-prod";
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: path, content: file.content }),
        }).catch(() => { /* git repo may not be available */ });
      },

      pushToDev: async () => {
        const state = get();
        const candidates = Object.entries(state.files).filter(
          ([, file]) =>
            file.status === "saved_local" && file.content === file.savedContent
        );

        if (candidates.length === 0) return { pushed: 0 };

        const now = new Date().toISOString();
        set({
          files: Object.fromEntries(
            Object.entries(state.files).map(([path, file]) => [
              path,
              candidates.find(([candidatePath]) => candidatePath === path)
                ? { ...file, status: "submitted", submittedAt: now }
                : file,
            ])
          ),
        });

        await Promise.allSettled(
          candidates.map(([path, file]) =>
            fetch("/api/git/submit-dev", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePath: path, content: file.content }),
            })
          )
        );

        return { pushed: candidates.length };
      },

      pushToProd: async () => {
        const state = get();
        const candidates = Object.entries(state.files).filter(
          ([, file]) =>
            (file.status === "saved_local" || file.status === "submitted") &&
            file.content === file.savedContent
        );

        if (candidates.length === 0) return { pushed: 0 };

        const now = new Date().toISOString();
        set({
          files: Object.fromEntries(
            Object.entries(state.files).map(([path, file]) => [
              path,
              candidates.find(([candidatePath]) => candidatePath === path)
                ? { ...file, status: "pending_approval", submittedAt: now }
                : file,
            ])
          ),
        });

        await Promise.allSettled(
          candidates.map(([path, file]) =>
            fetch("/api/git/submit-prod", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filePath: path, content: file.content }),
            })
          )
        );

        return { pushed: candidates.length, mockPrId: `MOCK-PR-${Date.now().toString().slice(-6)}` };
      },

      approveFile: (path) => {
        const state = get();
        const file = state.files[path];
        if (!file || file.status !== "pending_approval") return;
        set({
          files: {
            ...state.files,
            [path]: {
              ...file,
              status: "approved",
              savedContent: file.content,
              approvedAt: new Date().toISOString(),
            },
          },
        });
        // Async git approve (merge to prod)
        fetch("/api/git/approve-prod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: path }),
        }).catch(() => { /* git repo may not be available */ });
      },

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

      approveAll: () => {
        const state = get();
        const updated = { ...state.files };
        const now = new Date().toISOString();
        let hasPending = false;
        for (const [path, file] of Object.entries(updated)) {
          if (file.status === "pending_approval") {
            hasPending = true;
            updated[path] = {
              ...file,
              status: "approved",
              savedContent: file.content,
              approvedAt: now,
            };
          }
        }
        if (!hasPending) return;
        set({ files: updated });
        fetch("/api/git/approve-prod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        }).catch(() => {});
      },

      rejectAll: () =>
        set((state) => {
          const updated = { ...state.files };
          let hasPending = false;
          for (const [path, file] of Object.entries(updated)) {
            if (file.status === "pending_approval") {
              hasPending = true;
              updated[path] = { ...file, status: "draft" };
            }
          }
          if (!hasPending) return state;
          return { files: updated };
        }),

      resetToDefaults: () =>
        set({
          files: initialFiles,
          selectedFile: null,
          selectedFolder: null,
          expandedFolders: new Set<string>(),
          sidebarWidth: 256,
          darkMode: true,
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
