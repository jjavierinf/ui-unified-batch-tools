"use client";

import { usePipelineStore } from "@/lib/pipeline-store";
import { PipelineOverview } from "./PipelineOverview";
import { PipelineNav } from "./PipelineNav";
import { PipelineDetail } from "./PipelineDetail";

export function PipelineBoard() {
  const selectedPipeline = usePipelineStore((s) => s.selectedPipeline);

  if (!selectedPipeline) {
    return <PipelineOverview />;
  }

  return (
    <div className="flex-1 min-h-0 flex bg-background">
      <PipelineNav />
      <PipelineDetail />
    </div>
  );
}
