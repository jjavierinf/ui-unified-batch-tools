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

// ── Task configuration types (from configfile_proposal.yml) ──

export type WorkloadLevel = "low" | "medium" | "high";
export type LoadTargetType = "DB" | "S3" | "Email";
export type DqaQueryType = "single_query_notification" | "source_vs_target_query_comparison";
export type DqaAlertKind = "warning" | "error";

export interface TaskConnection {
  source: string;
  target?: string;
}

export interface TaskQueryConfig {
  file: string;
  timezone?: string;
}

export interface LoadTarget {
  type: LoadTargetType;
  connection?: { target: string };
  to?: string[];
  cc?: string[];
  subject?: string;
  body?: string;
}

export interface DqaConfig {
  queryType?: DqaQueryType;
  alertKind?: DqaAlertKind;
  tolerance?: number;
}

export interface TaskConfig {
  expectedWorkload?: WorkloadLevel;
  connection?: TaskConnection;
  query?: TaskQueryConfig;
  loadTarget?: LoadTarget;
  dqa?: DqaConfig;
}

export interface PipelineTask {
  id: string;
  name: string;
  dagName: string;
  stage: PipelineStage;
  taskType: "snapshot" | "incremental";
  sqlFilePath: string;
  order: number;
  taskConfig?: TaskConfig;
}

export interface DagConfig {
  dagName: string;
  integrationName: string;
  schedule: string;
  tags: string[];
  dagType: "snapshot" | "incremental";
  // Extended fields from configfile_proposal.yml
  owner?: string;
  startDate?: string;
  timezone?: string;
  team?: string;
  incidentsChannel?: string;
  alertsChannel?: string;
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
