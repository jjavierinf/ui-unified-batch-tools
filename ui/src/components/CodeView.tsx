"use client";

import { Sidebar } from "./Sidebar";
import { EditorPanel } from "./EditorPanel";

export function CodeView() {
  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar />
      <EditorPanel />
    </div>
  );
}
