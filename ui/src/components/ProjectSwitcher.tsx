"use client";

import { useState } from "react";
import { useProjectStore, getActiveProject, getAllProjects } from "@/lib/project-store";
import { useEditorStore } from "@/lib/store";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useToastStore } from "@/lib/toast-store";

export function ProjectSwitcher() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const switchProject = useProjectStore((s) => s.switchProject);
  const customProjects = useProjectStore((s) => s.customProjects);
  const createProject = useProjectStore((s) => s.createProject);
  const loadEditorProject = useEditorStore((s) => s.loadProject);
  const loadPipelineProject = usePipelineStore((s) => s.loadProject);
  const addToast = useToastStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const projects = getAllProjects(customProjects);
  const active = getActiveProject(activeProjectId, customProjects);

  const handleSwitch = (id: string) => {
    if (id === activeProjectId) {
      setOpen(false);
      return;
    }
    const project = getActiveProject(id, customProjects);
    switchProject(id);
    loadEditorProject(project.files);
    loadPipelineProject(project.dagConfigs, project.tasks);
    setOpen(false);
    addToast(`Switched to project: ${project.name}`);
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = createProject(trimmed);
    // Read fresh state after createProject updated the store
    const fresh = useProjectStore.getState().customProjects;
    const project = getActiveProject(id, fresh);
    switchProject(id);
    loadEditorProject(project.files);
    loadPipelineProject(project.dagConfigs, project.tasks);
    setNewName("");
    setCreating(false);
    setOpen(false);
    addToast(`Created project: ${project.name}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-sidebar-border bg-background text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Project</span>
        <span className="text-[11px] font-medium max-w-[120px] truncate">{active.name}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-text-tertiary">
          <path d="M1 3l3 3 3-3z" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setCreating(false); }} />
          <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-sidebar-border bg-surface shadow-lg py-1">
            <div className="px-3 py-2 border-b border-sidebar-border">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">Projects</p>
            </div>
            {projects.map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSwitch(p.id)}
                  className={`w-full text-left px-3 py-2.5 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-accent/10"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${isActive ? "text-accent" : "text-foreground"}`}>
                      {p.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-0.5 ml-3.5">
                    {p.branch} — {p.description}
                  </p>
                </button>
              );
            })}

            <div className="border-t border-sidebar-border mt-1 pt-1 px-3 pb-2">
              {creating ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Project name..."
                    className="flex-1 text-xs px-2 py-1.5 rounded border border-sidebar-border bg-background text-foreground placeholder:text-text-tertiary outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="text-xs px-2 py-1.5 rounded bg-accent text-white hover:bg-accent/80 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 text-xs text-text-secondary hover:text-foreground py-1.5 cursor-pointer transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New project
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
