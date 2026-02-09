"use client";

import { DiffEditor } from "@monaco-editor/react";
import { useEditorStore } from "@/lib/store";

export function SqlDiffViewer() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const darkMode = useEditorStore((s) => s.darkMode);

  const file = selectedFile ? files[selectedFile] : null;

  if (!file || !selectedFile) return null;

  return (
    <DiffEditor
      key={`diff-${selectedFile}`}
      original={file.savedContent}
      modified={file.content}
      language="sql"
      theme={darkMode ? "vs-dark" : "light"}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        renderSideBySide: false,
        padding: { top: 8 },
        automaticLayout: true,
      }}
    />
  );
}
