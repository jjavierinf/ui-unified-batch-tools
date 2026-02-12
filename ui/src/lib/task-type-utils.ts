import { PipelineStage } from "./types";

const TRANSPARENT_DDL_FILES = new Set([
  "create_table_stage.sql",
  "create_table_data_model.sql",
]);

export function getStageFromPath(path: string): PipelineStage {
  if (path.includes("/extract/")) return "extract";
  if (path.includes("/transform/")) return "transform";
  if (path.includes("/load/")) return "load";
  if (path.includes("/ddl/")) return "ddl";
  if (path.includes("/dqa/")) return "dqa";

  // Backward compatibility while migrating persisted/local legacy paths.
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

export function isTransparentSystemDdlPath(path: string): boolean {
  if (!path.includes("/ddl/")) return false;
  const name = path.split("/").pop() ?? "";
  return TRANSPARENT_DDL_FILES.has(name);
}

export function isTransparentSystemDdlTask(taskName: string, path: string): boolean {
  void taskName;
  return isTransparentSystemDdlPath(path);
}
