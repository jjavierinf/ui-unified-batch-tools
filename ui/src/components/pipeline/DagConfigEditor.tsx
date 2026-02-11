"use client";

import { useId, useState } from "react";
import { DagConfig } from "@/lib/types";
import { CronInput } from "./CronInput";
import { TagEditor } from "./TagEditor";

type ConfigTab = "basic" | "schedule" | "tags" | "channels";

const TIMEZONES = [
  "UTC",
  "US/Eastern",
  "US/Pacific",
  "Europe/London",
  "Europe/Madrid",
];

interface DagConfigEditorProps {
  config: DagConfig;
  onUpdateSchedule: (schedule: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onUpdateField: (field: string, value: string) => void;
  allTags: string[];
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-foreground mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-sidebar-border rounded-md px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-foreground mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-sidebar-border rounded-md px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-foreground mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-sidebar-border rounded-md px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

const CONFIG_TABS: { key: ConfigTab; label: string }[] = [
  { key: "basic", label: "Basic Info" },
  { key: "schedule", label: "Schedule" },
  { key: "tags", label: "Tags" },
  { key: "channels", label: "Channels" },
];

export function DagConfigEditor({
  config,
  onUpdateSchedule,
  onAddTag,
  onRemoveTag,
  onUpdateField,
  allTags,
}: DagConfigEditorProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>("basic");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-sidebar-border bg-surface shrink-0">
        {CONFIG_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-2 py-2.5 text-[11px] font-medium transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.key
                ? "text-foreground border-accent"
                : "text-text-tertiary hover:text-text-secondary border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "basic" && (
          <div className="space-y-4">
            <TextInput
              label="Owner"
              value={config.owner ?? ""}
              onChange={(v) => onUpdateField("owner", v)}
              placeholder="e.g. javier"
            />
            <DateInput
              label="Start Date"
              value={config.startDate ?? ""}
              onChange={(v) => onUpdateField("startDate", v)}
            />
            <SelectInput
              label="Timezone"
              value={config.timezone ?? "UTC"}
              onChange={(v) => onUpdateField("timezone", v)}
              options={TIMEZONES}
            />
          </div>
        )}

        {activeTab === "schedule" && (
          <CronInput value={config.schedule} onChange={onUpdateSchedule} />
        )}

        {activeTab === "tags" && (
          <TagEditor
            tags={config.tags}
            onAdd={onAddTag}
            onRemove={onRemoveTag}
            allTags={allTags}
          />
        )}

        {activeTab === "channels" && (
          <div className="space-y-4">
            <TextInput
              label="Team"
              value={config.team ?? ""}
              onChange={(v) => onUpdateField("team", v)}
              placeholder="e.g. data-engineering"
            />
            <TextInput
              label="Incidents Channel"
              value={config.incidentsChannel ?? ""}
              onChange={(v) => onUpdateField("incidentsChannel", v)}
              placeholder="e.g. #incidents-data"
            />
            <TextInput
              label="Alerts Channel"
              value={config.alertsChannel ?? ""}
              onChange={(v) => onUpdateField("alertsChannel", v)}
              placeholder="e.g. #alerts-data"
            />
          </div>
        )}
      </div>
    </div>
  );
}
