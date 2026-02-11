import { PipelineStage } from "./types";

export function getStageFromPath(path: string): PipelineStage {
  if (path.includes("/extract/")) return "extract";
  if (path.includes("/transform/")) return "transform";
  if (path.includes("/load/")) return "load";
  if (path.includes("/dqa/")) return "dqa";

  // Backward compatibility while migrating persisted/local legacy paths.
  if (path.includes("/ddl/")) return "extract";
  if (path.includes("/transformations/") || path.includes("/dml/")) return "transform";
  // default
  return "extract";
}

export function isDdlTask(taskName: string, path: string): boolean {
  return path.includes("/ddl/") || taskName.startsWith("ddl_") || taskName.startsWith("create_table_");
}

export function isDdlPath(path: string): boolean {
  return path.includes("/ddl/");
}
