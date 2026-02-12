import { FileStatus, PipelineTask, SqlFile } from "./types";
import { isDdlTask } from "./task-type-utils";

const PRIORITY: Record<FileStatus, number> = {
  draft: 0,
  saved_local: 1,
  submitted: 2,
  pending_approval: 3,
  approved: 4,
};

const ORDER: FileStatus[] = ["draft", "saved_local", "submitted", "pending_approval", "approved"];

export const STATUS_MEANING: Record<FileStatus, string> = {
  draft: "Local work in progress.",
  saved_local: "Saved locally and ready to push.",
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
