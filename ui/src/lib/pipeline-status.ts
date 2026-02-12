import { FileStatus, PipelineTask, SqlFile } from "./types";
import { isDdlTask } from "./task-type-utils";

const PRIORITY: Record<FileStatus, number> = {
  draft: 0,
  submitted: 1,
  pending_approval: 2,
  approved: 3,
};

const ORDER: FileStatus[] = ["draft", "submitted", "pending_approval", "approved"];

export const STATUS_MEANING: Record<FileStatus, string> = {
  draft: "Local work in progress.",
  submitted: "Sent to environment branch.",
  pending_approval: "Submitted to prod, waiting leader approval.",
  approved: "Approved and merged to main.",
};

export function getPipelineStatus(
  files: Record<string, SqlFile>,
  tasks: PipelineTask[],
  dagName: string
): FileStatus {
  let status: FileStatus = "approved";
  for (const task of tasks) {
    if (task.dagName !== dagName) continue;
    if (isDdlTask(task.name, task.sqlFilePath)) continue;
    const file = files[task.sqlFilePath];
    if (!file) continue;
    if (PRIORITY[file.status] < PRIORITY[status]) {
      status = file.status;
    }
  }
  return status;
}

export function getNextStatus(status: FileStatus): FileStatus {
  return ORDER[(ORDER.indexOf(status) + 1) % ORDER.length];
}
