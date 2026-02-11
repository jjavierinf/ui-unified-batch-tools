"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { EditorPanel } from "./EditorPanel";

const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 560;

export function CodeView() {
  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, event.clientX - rect.left)
      );
      setSidebarWidth(nextWidth);
    };

    const stopResizing = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResizing);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResizing);
    };
  }, [setSidebarWidth]);

  const startResizing = () => {
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="px-4 py-1.5 border-b border-sidebar-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
            SQL Explorer
          </span>
          <span className="text-xs text-foreground">Mock Connection: demo_sqlserver_primary</span>
        </div>
        <span className="text-[10px] text-text-tertiary">Read/Write scaffold mode</span>
      </div>
      <div ref={containerRef} className="flex flex-1 min-h-0">
        <div
          className="shrink-0 min-h-0"
          style={{ width: `${sidebarWidth}px` }}
        >
          <Sidebar />
        </div>
        <div
          className="w-1 shrink-0 cursor-col-resize bg-sidebar-border/30 hover:bg-accent/50 transition-colors"
          onPointerDown={startResizing}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />
        <EditorPanel />
      </div>
    </div>
  );
}
