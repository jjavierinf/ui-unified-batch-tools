"use client";

import { useEditorStore } from "@/lib/store";
import { Environment } from "@/lib/types";

const options: {
  value: Environment;
  label: string;
  dotClass: string;
  activeClass: string;
}[] = [
  {
    value: "dev",
    label: "Dev",
    dotClass: "bg-green-500",
    activeClass: "bg-green-600 text-white dark:bg-green-500",
  },
  {
    value: "prod",
    label: "Prod",
    dotClass: "bg-orange-500",
    activeClass: "bg-orange-600 text-white dark:bg-orange-500",
  },
];

export function EnvironmentToggle() {
  const environment = useEditorStore((s) => s.environment);
  const setEnvironment = useEditorStore((s) => s.setEnvironment);

  return (
    <div
      data-tour="environment-toggle"
      className="flex items-center rounded-full border border-sidebar-border overflow-hidden bg-surface-hover p-0.5 gap-0.5"
      title="Submission environment (not a git branch checkout)"
    >
      {options.map((opt) => {
        const isActive = environment === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setEnvironment(opt.value)}
            title={
              opt.value === "dev"
                ? "Send submit/push actions to Dev flow"
                : "Send submit/push actions to Prod review flow"
            }
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              isActive
                ? `${opt.activeClass} shadow-sm`
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-white" : opt.dotClass
              }`}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
