"use client";

import { useId, useState } from "react";
import { describeCron } from "@/lib/cron-utils";

interface CronInputProps {
  value: string;
  onChange: (value: string) => void;
}

const presets = [
  { label: "Hourly", cron: "0 * * * *" },
  { label: "Every 3h", cron: "0 */3 * * *" },
  { label: "Daily 6am", cron: "0 6 * * *" },
  { label: "Every 15m", cron: "*/15 * * * *" },
];

export function CronInput({ value, onChange }: CronInputProps) {
  const id = useId();
  const [showPresets, setShowPresets] = useState(false);
  const description = describeCron(value);
  const isValid = description !== "Invalid cron";
  const parts = value.trim().split(/\s+/);
  const partCount = parts.length;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-foreground mb-1.5"
      >
        Schedule (cron)
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border rounded-md px-3 py-2 bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 transition-colors ${
            isValid
              ? "border-sidebar-border focus:ring-accent/50 focus:border-accent"
              : "border-red-400 focus:ring-red-400/50 focus:border-red-400"
          }`}
          placeholder="* * * * *"
          spellCheck={false}
          onFocus={() => setShowPresets(true)}
          onBlur={() => setTimeout(() => setShowPresets(false), 150)}
        />
        {/* Part count helper */}
        <span
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
            partCount === 5 ? "text-text-tertiary" : "text-red-400"
          }`}
        >
          {partCount}/5
        </span>
      </div>

      {/* Description */}
      <div className="flex items-center gap-1.5 mt-1.5">
        {isValid ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500 shrink-0"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-400 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
        <p
          className={`text-xs ${isValid ? "text-text-tertiary" : "text-red-400"}`}
        >
          {description}
        </p>
      </div>

      {/* Preset buttons */}
      {showPresets && (
        <div className="flex flex-wrap gap-1 mt-2">
          {presets.map((preset) => (
            <button
              key={preset.cron}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(preset.cron);
                setShowPresets(false);
              }}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                value === preset.cron
                  ? "bg-accent/10 border-accent text-accent"
                  : "border-sidebar-border text-text-secondary hover:border-accent hover:text-accent"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
