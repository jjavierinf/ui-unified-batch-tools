"use client";

import { TreeNode } from "@/lib/types";
import { FileTreeNode } from "./FileTreeNode";

interface FileTreeProps {
  nodes: TreeNode[];
}

export function FileTree({ nodes }: FileTreeProps) {
  return (
    <div className="text-sm" role="tree" aria-label="File explorer">
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
