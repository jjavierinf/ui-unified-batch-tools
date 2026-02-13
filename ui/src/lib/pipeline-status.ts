import { FileStatus, PipelineTask, SqlFile } from "./types";
import { isTransparentSystemDdlTask } from "./task-type-utils";
import { STATUS_UI } from "./status-ui";
import { getTaskFilePaths } from "./task-files";

const PRIORITY: Record<FileStatus, number> = {
  draft: 0,
  saved_local: 1,
  submitted: 2,
  pending_approval: 3,
  approved: 4,
};

const ORDER: FileStatus[] = ["draft", "saved_local", "submitted", "pending_approval", "approved"];

export const STATUS_MEANING: Record<FileStatus, string> = {
  draft: STATUS_UI.draft.meaning,
  saved_local: STATUS_UI.saved_local.meaning,
  submitted: STATUS_UI.submitted.meaning,
  pending_approval: STATUS_UI.pending_approval.meaning,
  approved: STATUS_UI.approved.meaning,
};

export function getPipelineStatus(
  files: Record<string, SqlFile>,
  tasks: PipelineTask[],
  dagName: string
): FileStatus {
  let status: FileStatus = "approved";
  for (const task of tasks) {
    if (task.dagName !== dagName) continue;
    if (isTransparentSystemDdlTask(task.name, task.sqlFilePath)) continue;
    const paths = getTaskFilePaths(task);
    for (const path of paths) {
      const file = files[path];
      if (!file) continue;
      if (PRIORITY[file.status] < PRIORITY[status]) {
        status = file.status;
      }
    }
  }
  return status;
}

export function getNextStatus(status: FileStatus): FileStatus {
  return ORDER[(ORDER.indexOf(status) + 1) % ORDER.length];
}
