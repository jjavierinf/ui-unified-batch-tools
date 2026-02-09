export type Environment = "dev" | "prod";
export type FileStatus = "draft" | "submitted" | "pending_approval" | "approved";

export interface SqlFile {
  content: string;
  savedContent: string;
  status: FileStatus;
  submittedAt?: string;
  approvedAt?: string;
}

export type PipelineStage = "extract" | "transform" | "load" | "dqa";

export interface PipelineTask {
  id: string;
  name: string;
  dagName: string;
  stage: PipelineStage;
  taskType: "snapshot" | "incremental";
  sqlFilePath: string;
  order: number;
}

export interface DagConfig {
  dagName: string;
  integrationName: string;
  schedule: string;
  tags: string[];
  dagType: "snapshot" | "incremental";
}

export interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
}

export interface MockData {
  files: Record<string, SqlFile>;
  dags: DagConfig[];
}
