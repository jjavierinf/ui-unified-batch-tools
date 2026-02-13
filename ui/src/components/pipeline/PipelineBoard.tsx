"use client";

import { useEffect, useRef } from "react";
import { usePipelineStore } from "@/lib/pipeline-store";
import { useEditorStore } from "@/lib/store";
import { PipelineOverview } from "./PipelineOverview";
import { PipelineNav } from "./PipelineNav";
import { PipelineDetail } from "./PipelineDetail";

const MIN_NAV_WIDTH = 160;
const MAX_NAV_WIDTH = 400;

export function PipelineBoard() {
  const selectedPipeline = usePipelineStore((s) => s.selectedPipeline);
  const sidebarWidth = useEditorStore((s) => s.sidebarWidth);
  const setSidebarWidth = useEditorStore((s) => s.setSidebarWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextWidth = Math.min(
        MAX_NAV_WIDTH,
        Math.max(MIN_NAV_WIDTH, event.clientX - rect.left)
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

  if (!selectedPipeline) {
    return <PipelineOverview />;
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0 flex bg-background">
      <div className="shrink-0 min-h-0" style={{ width: `${sidebarWidth}px` }}>
        <PipelineNav />
      </div>
      <div
        className="w-1 shrink-0 cursor-col-resize bg-sidebar-border/30 hover:bg-accent/50 transition-colors"
        onPointerDown={startResizing}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize nav"
      />
      <PipelineDetail />
    </div>
  );
}
