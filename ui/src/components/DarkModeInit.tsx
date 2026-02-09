"use client";
import { useEffect } from "react";
import { useEditorStore } from "@/lib/store";

export function DarkModeInit() {
  const darkMode = useEditorStore((s) => s.darkMode);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  return null;
}
