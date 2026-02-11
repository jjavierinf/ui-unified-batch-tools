import simpleGit, { SimpleGit } from "simple-git";

const REPO_PATH = process.env.EXTERNAL_REPO_PATH || "/tmp/test-pipeline-repo";

function getGit(): SimpleGit {
  return simpleGit(REPO_PATH);
}

export interface GitStatus {
  branch: string;
  modified: string[];
  staged: string[];
  log: { hash: string; message: string; date: string }[];
}

export interface MergeRequestInfo {
  filePath: string;
  message: string;
  targetBranch: string;
  createdAt: string;
}

export async function getStatus(): Promise<GitStatus> {
  const git = getGit();
  const status = await git.status();
  const log = await git.log({ maxCount: 10 });
  return {
    branch: status.current || "unknown",
    modified: status.modified,
    staged: status.staged,
    log: log.all.map((l) => ({ hash: l.hash.slice(0, 7), message: l.message, date: l.date })),
  };
}

export async function initRepo(): Promise<{ branch: string }> {
  const git = getGit();
  // Create a feature branch from dev
  const branchName = `feature/${Date.now()}`;
  await git.checkout("dev");
  await git.checkoutLocalBranch(branchName);
  return { branch: branchName };
}

export async function saveFile(filePath: string, content: string): Promise<void> {
  // Write file to disk in the repo
  const fs = await import("fs/promises");
  const path = await import("path");
  const fullPath = path.join(REPO_PATH, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}

export async function submitToDev(filePath: string, content: string, message?: string): Promise<{ hash: string }> {
  const git = getGit();
  await saveFile(filePath, content);
  await git.add(filePath);
  const commitMsg = message || `Update ${filePath.split("/").pop()}`;
  const result = await git.commit(commitMsg);
  // Merge to dev
  const currentBranch = (await git.status()).current || "";
  await git.checkout("dev");
  await git.merge([currentBranch]);
  await git.checkout(currentBranch);
  // TODO: Replace direct merge with PR creation via Bitbucket API
  return { hash: result.commit || "unknown" };
}

export async function submitToProd(filePath: string, content: string, message?: string): Promise<MergeRequestInfo> {
  const git = getGit();
  await saveFile(filePath, content);
  await git.add(filePath);
  const commitMsg = message || `Update ${filePath.split("/").pop()} for production`;
  await git.commit(commitMsg);
  // Don't merge yet — create a "merge request" (saved in memory for now)
  // TODO: Replace direct merge with PR creation via Bitbucket API
  return {
    filePath,
    message: commitMsg,
    targetBranch: "main",
    createdAt: new Date().toISOString(),
  };
}

export async function approveProd(filePath: string): Promise<{ hash: string }> {
  const git = getGit();
  const currentBranch = (await git.status()).current || "";
  await git.checkout("main");
  await git.merge([currentBranch]);
  await git.checkout(currentBranch);
  // TODO: Replace direct merge with PR creation via Bitbucket API
  return { hash: "merged" };
}

export async function getCurrentBranch(): Promise<string> {
  const git = getGit();
  const status = await git.status();
  return status.current || "unknown";
}
