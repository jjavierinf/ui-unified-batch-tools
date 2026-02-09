"use client";

import { useId } from "react";
import { describeCron } from "@/lib/cron-utils";

interface CronInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CronInput({ value, onChange }: CronInputProps) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-1"
      >
        Schedule (cron)
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-sidebar-border rounded-md px-3 py-2 bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        placeholder="* * * * *"
        spellCheck={false}
      />
      <p className="mt-1 text-xs text-text-tertiary">{describeCron(value)}</p>
    </div>
  );
}
