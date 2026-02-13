"use client";

import { useSafetyStore, DEFAULT_SAFETY } from "@/lib/safety-store";

function Field({
  label,
  hint,
  value,
  onChange,
  min,
  step = 1,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div className="rounded-lg border border-sidebar-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-text-tertiary mt-1">{hint}</p>
        </div>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-[140px] shrink-0 rounded-md border border-sidebar-border bg-background px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
    </div>
  );
}

export function SafetyGuardrailsView() {
  const config = useSafetyStore((s) => s.config);
  const update = useSafetyStore((s) => s.update);
  const reset = useSafetyStore((s) => s.resetToDefaults);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-background">
      <div className="px-6 py-4 border-b border-sidebar-border bg-surface">
        <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
          Team Leader
        </p>
        <h2 className="text-lg font-semibold text-foreground mt-1">
          Safety guardrails
        </h2>
        <p className="text-sm text-text-secondary mt-2 max-w-2xl">
          Team guardrails to prevent heavy or risky queries. In this scaffold, enforcement is mock/deterministic, but the UX makes clear which rules would apply.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs rounded-md border border-sidebar-border text-text-secondary hover:bg-surface-hover cursor-pointer"
          >
            Reset to defaults
          </button>
          <span className="text-[11px] text-text-tertiary">
            Defaults: idle {DEFAULT_SAFETY.minIdlePctExplorer}% / {DEFAULT_SAFETY.minIdlePctPipes}% · runtime {DEFAULT_SAFETY.maxRuntimeMsExplorer}ms / {DEFAULT_SAFETY.maxRuntimeMsPipes}ms
          </span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field
          label="Max query runtime (SQL Explorer) [ms]"
          hint="Blocks Run query if estimated runtime (mock) exceeds this value."
          value={config.maxRuntimeMsExplorer}
          min={100}
          step={100}
          onChange={(v) => update({ maxRuntimeMsExplorer: v })}
        />
        <Field
          label="Max query runtime (SQL Pipes) [ms]"
          hint="Blocks Simulate run if estimated runtime (mock) exceeds this value."
          value={config.maxRuntimeMsPipes}
          min={100}
          step={100}
          onChange={(v) => update({ maxRuntimeMsPipes: v })}
        />
        <Field
          label="Min idle resources (SQL Explorer) [%]"
          hint="Blocks Run query if current idle% (mock) is below this threshold."
          value={config.minIdlePctExplorer}
          min={0}
          step={1}
          onChange={(v) => update({ minIdlePctExplorer: v })}
        />
        <Field
          label="Min idle resources (SQL Pipes) [%]"
          hint="Blocks Simulate run if current idle% (mock) is below this threshold."
          value={config.minIdlePctPipes}
          min={0}
          step={1}
          onChange={(v) => update({ minIdlePctPipes: v })}
        />
        <Field
          label="Default limit rows (SQL Explorer)"
          hint="Suggests LIMIT for SELECT queries without LIMIT/TOP."
          value={config.defaultLimitRowsExplorer}
          min={1}
          step={50}
          onChange={(v) => update({ defaultLimitRowsExplorer: v })}
        />
      </div>
    </div>
  );
}
