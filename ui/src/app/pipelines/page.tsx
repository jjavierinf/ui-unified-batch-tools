"use client";

import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { HydrationGuard } from "@/components/HydrationGuard";

export default function PipelinesPage() {
  return (
    <HydrationGuard>
      <div className="flex flex-col h-full bg-background">
        <PipelineHeader />
        <PipelineBoard />
      </div>
    </HydrationGuard>
  );
}
