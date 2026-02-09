import { TreeNode } from "./types";

export function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();

  const getOrCreateFolder = (folderPath: string): TreeNode => {
    const existing = folderMap.get(folderPath);
    if (existing) return existing;

    const parts = folderPath.split("/");
    const name = parts[parts.length - 1];
    const node: TreeNode = { name, path: folderPath, isFolder: true, children: [] };
    folderMap.set(folderPath, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = getOrCreateFolder(parentPath);
      parent.children.push(node);
    }

    return node;
  };

  const sqlPaths = paths.filter((p) => p.endsWith(".sql")).sort();

  for (const filePath of sqlPaths) {
    const parts = filePath.split("/");
    const fileName = parts[parts.length - 1];

    const fileNode: TreeNode = {
      name: fileName,
      path: filePath,
      isFolder: false,
      children: [],
    };

    if (parts.length === 1) {
      root.push(fileNode);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = getOrCreateFolder(parentPath);
      parent.children.push(fileNode);
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    }).map((n) => ({
      ...n,
      children: n.isFolder ? sortNodes(n.children) : [],
    }));
  };

  return sortNodes(root);
}
