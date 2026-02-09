"use client";

import { useId } from "react";

interface CronInputProps {
  value: string;
  onChange: (value: string) => void;
}

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression";

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const isWild = (v: string) => v === "*";

  // Every N minutes: */N * * * *
  if (minute.startsWith("*/") && isWild(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    const n = parseInt(minute.slice(2), 10);
    if (!isNaN(n)) return n === 1 ? "Every minute" : `Every ${n} minutes`;
  }

  // Every hour at minute 0: 0 * * * *
  if (minute === "0" && isWild(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    return "Every hour";
  }

  // Every hour at minute N: N * * * *
  if (/^\d+$/.test(minute) && isWild(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    return `Every hour at minute ${minute}`;
  }

  // Daily at specific hour: 0 H * * *  or  M H * * *
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `Daily at ${hh}:${mm}`;
  }

  // Specific minute with comma-separated hours: M H1,H2,... * * *
  if (/^\d+$/.test(minute) && hour.includes(",") && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    const hours = hour.split(",").map((h) => parseInt(h, 10)).sort((a, b) => a - b);
    if (hours.length >= 2) {
      const diff = hours[1] - hours[0];
      const isEvenlySpaced = hours.every((h, i) => i === 0 || h - hours[i - 1] === diff);
      if (isEvenlySpaced) {
        return `At minute ${minute}, every ${diff} hours`;
      }
    }
    return `At minute ${minute}, at hours ${hour}`;
  }

  // Every N hours: 0 */N * * *
  if (minute === "0" && hour.startsWith("*/") && isWild(dayOfMonth) && isWild(month) && isWild(dayOfWeek)) {
    const n = parseInt(hour.slice(2), 10);
    if (!isNaN(n)) return n === 1 ? "Every hour" : `Every ${n} hours`;
  }

  return "Custom schedule";
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
