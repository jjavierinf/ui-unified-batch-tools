"use client";

import { useEditorStore } from "@/lib/store";
import { Environment } from "@/lib/types";

export function EnvironmentToggle() {
  const environment = useEditorStore((s) => s.environment);
  const setEnvironment = useEditorStore((s) => s.setEnvironment);

  const options: { value: Environment; label: string; dotColor: string }[] = [
    { value: "dev", label: "Dev", dotColor: "bg-green-500" },
    { value: "prod", label: "Prod", dotColor: "bg-orange-500" },
  ];

  return (
    <div className="flex items-center rounded-md border border-sidebar-border overflow-hidden">
      {options.map((opt) => {
        const isActive = environment === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setEnvironment(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-accent text-white"
                : "bg-surface-hover text-text-secondary hover:text-foreground"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${opt.dotColor}`}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
