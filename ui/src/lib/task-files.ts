import type { PipelineTask } from "./types";

function dirOf(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function resolveRelativeOrAbsolute(baseDir: string, candidate: string): string {
  if (!candidate) return candidate;
  if (candidate.includes("/")) return candidate;
  if (!baseDir) return candidate;
  return `${baseDir}/${candidate}`;
}

export function isDqaCompareTask(task: PipelineTask): boolean {
  return (
    task.stage === "dqa" &&
    task.taskConfig?.dqa?.queryType === "source_vs_target_query_comparison"
  );
}

export function getDqaCompareFilePaths(
  task: PipelineTask
): { sourcePath: string; targetPath: string } | null {
  if (!isDqaCompareTask(task)) return null;

  const baseDir = dirOf(task.sqlFilePath);
  const dqa = task.taskConfig?.dqa;
  const sourceCandidate = dqa?.sourceQueryFile ?? task.sqlFilePath;
  const targetCandidate = dqa?.targetQueryFile ?? "";

  const sourcePath = resolveRelativeOrAbsolute(baseDir, sourceCandidate);
  const targetPath = resolveRelativeOrAbsolute(baseDir, targetCandidate);

  if (!sourcePath || !targetPath) return null;
  return { sourcePath, targetPath };
}

export function getTaskFilePaths(task: PipelineTask): string[] {
  const paths = new Set<string>();
  if (task.sqlFilePath) paths.add(task.sqlFilePath);

  const compare = getDqaCompareFilePaths(task);
  if (compare) {
    paths.add(compare.sourcePath);
    paths.add(compare.targetPath);
  }

  return Array.from(paths);
}

export function taskMatchesFile(task: PipelineTask, filePath: string): boolean {
  if (!filePath) return false;
  return getTaskFilePaths(task).includes(filePath);
}

