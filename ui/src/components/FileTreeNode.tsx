"use client";

import { TreeNode } from "@/lib/types";
import { useEditorStore } from "@/lib/store";
import { StatusBadge } from "./StatusBadge";

interface FileTreeNodeProps {
  node: TreeNode;
  depth: number;
}

function FolderIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-accent/70"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-text-tertiary"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SqlFileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-text-tertiary"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const selectedFolder = useEditorStore((s) => s.selectedFolder);
  const expandedFolders = useEditorStore((s) => s.expandedFolders);
  const files = useEditorStore((s) => s.files);
  const toggleFolder = useEditorStore((s) => s.toggleFolder);
  const selectFile = useEditorStore((s) => s.selectFile);
  const selectFolder = useEditorStore((s) => s.selectFolder);

  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;
  const isFolderSelected = selectedFolder === node.path;
  const file = !node.isFolder ? files[node.path] : null;
  const isModified = file ? file.content !== file.savedContent : false;

  const paddingLeft = depth * 14 + 8;

  if (node.isFolder) {
    return (
      <div role="treeitem" aria-expanded={isExpanded} aria-selected={isFolderSelected}>
        <div
          className={`flex items-center gap-1.5 py-1 cursor-pointer rounded-sm mx-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:rounded-sm min-w-0 ${
            isFolderSelected
              ? "bg-accent/10 text-foreground"
              : "hover:bg-surface-hover text-foreground"
          }`}
          style={{ paddingLeft }}
          onClick={() => {
            selectFolder(node.path);
            toggleFolder(node.path);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              selectFolder(node.path);
              toggleFolder(node.path);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} folder ${node.name}`}
        >
          <span
            className={`transition-transform duration-150 inline-flex items-center justify-center w-3 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="currentColor"
              className="text-text-tertiary"
            >
              <path d="M2 1l4 3-4 3z" />
            </svg>
          </span>
          <FolderIcon open={isExpanded} />
          <span className="truncate text-xs min-w-0" title={node.name}>
            {node.name}
          </span>
        </div>
        {isExpanded &&
          <div role="group">
            {node.children.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        }
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 py-1 cursor-pointer rounded-sm mx-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:rounded-sm min-w-0 ${
        isSelected
          ? "bg-accent/15 text-foreground"
          : "text-text-secondary hover:bg-surface-hover"
      }`}
      style={{ paddingLeft: paddingLeft + 18 }}
      onClick={() => selectFile(node.path)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectFile(node.path);
        }
      }}
      tabIndex={0}
      role="treeitem"
      aria-selected={isSelected}
      aria-label={`${node.name}${isModified ? " (modified)" : ""}`}
    >
      <SqlFileIcon />
      <span className="truncate flex-1 min-w-0" title={node.name}>
        {node.name}
      </span>
      {isModified && (
        <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
      )}
      {file && file.status !== "draft" && (
        <span className="ml-auto mr-2 shrink-0">
          <StatusBadge status={file.status} />
        </span>
      )}
    </div>
  );
}
