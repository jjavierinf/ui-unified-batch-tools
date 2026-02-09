"use client";

import { useCallback, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useEditorStore } from "@/lib/store";

export function SqlEditor() {
  const selectedFile = useEditorStore((s) => s.selectedFile);
  const files = useEditorStore((s) => s.files);
  const updateContent = useEditorStore((s) => s.updateContent);
  const saveFile = useEditorStore((s) => s.saveFile);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const file = selectedFile ? files[selectedFile] : null;

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      // Cmd+S / Ctrl+S → save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (selectedFile) saveFile(selectedFile);
      });
    },
    [selectedFile, saveFile]
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (selectedFile && value !== undefined) {
        updateContent(selectedFile, value);
      }
    },
    [selectedFile, updateContent]
  );

  if (!file || !selectedFile) return null;

  return (
    <Editor
      key={selectedFile}
      defaultValue={file.content}
      language="sql"
      theme="vs-dark"
      onChange={handleChange}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        padding: { top: 8 },
        automaticLayout: true,
      }}
    />
  );
}
