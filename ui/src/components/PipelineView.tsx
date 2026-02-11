"use client";

import { PipelineBoard } from "./pipeline/PipelineBoard";

export function PipelineView() {
  return (
    <div className="flex flex-1 min-h-0 bg-background">
      <PipelineBoard />
    </div>
  );
}
