"use client";

import { TreeNode } from "@/lib/types";
import { useEditorStore } from "@/lib/store";
import { StatusBadge } from "./StatusBadge";

interface FileTreeNodeProps {
  node: TreeNode;
  depth: number;
}

export function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const expandedFolders = useEditorStore((s) => s.expandedFolders);
  const files = useEditorStore((s) => s.files);
  const toggleFolder = useEditorStore((s) => s.toggleFolder);
  const selectFile = useEditorStore((s) => s.selectFile);

  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;
  const file = !node.isFolder ? files[node.path] : null;
  const isModified = file ? file.content !== file.savedContent : false;

  const paddingLeft = depth * 12 + 8;

  if (node.isFolder) {
    return (
      <div>
        <div
          className="flex items-center py-0.5 cursor-pointer hover:bg-surface-hover text-foreground"
          style={{ paddingLeft }}
          onClick={() => toggleFolder(node.path)}
        >
          <span
            className={`mr-1 text-xs transition-transform duration-150 inline-block ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            ▶
          </span>
          <span className="truncate">{node.name}</span>
        </div>
        {isExpanded &&
          node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center py-0.5 cursor-pointer hover:bg-surface-hover ${
        isSelected ? "bg-accent/20 text-foreground" : "text-text-secondary"
      }`}
      style={{ paddingLeft: paddingLeft + 16 }}
      onClick={() => selectFile(node.path)}
    >
      <span className="truncate">{node.name}</span>
      {isModified && (
        <span className="ml-1.5 w-2 h-2 rounded-full bg-orange-400 shrink-0" />
      )}
      {file && file.status !== "draft" && (
        <span className="ml-auto mr-3 shrink-0">
          <StatusBadge status={file.status} />
        </span>
      )}
    </div>
  );
}
