"use client";

import { useMemo } from "react";
import { useEditorStore } from "@/lib/store";
import { usePipelineStore } from "@/lib/pipeline-store";

export function PipelineContextIndicator() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const tasks = usePipelineStore((s) => s.tasks);
  const dagConfigs = usePipelineStore((s) => s.dagConfigs);

  const pipelineInfo = useMemo(() => {
    if (!selectedFile) return null;
    const task = tasks.find((t) => t.sqlFilePath === selectedFile);
    if (!task) return null;
    const config = dagConfigs.find((d) => d.dagName === task.dagName);
    return config
      ? { name: config.dagName.replace(/^dag_/, ""), dagName: config.dagName }
      : null;
  }, [selectedFile, tasks, dagConfigs]);

  if (!pipelineInfo) return null;

  return (
    <span className="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full truncate">
      Pipeline: {pipelineInfo.name}
    </span>
  );
}
