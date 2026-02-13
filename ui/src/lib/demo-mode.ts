import { SqlFile } from "./types";

export const DEMO_MODE_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1";

// Demo mode exists to sanitize any accidental internal identifiers.
// Keep this list generic and avoid hardcoding company-specific names.
const REPLACEMENTS: Array<[string, string]> = [
  [".internal", ".demo.local"],
];

const SORTED_REPLACEMENTS = [...REPLACEMENTS].sort((a, b) => b[0].length - a[0].length);

export function anonymizeText(text: string): string {
  let next = text;
  for (const [from, to] of SORTED_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

export function deepAnonymize<T>(value: T): T {
  if (!DEMO_MODE_ENABLED) return value;
  if (typeof value === "string") return anonymizeText(value) as T;
  if (Array.isArray(value)) return value.map((item) => deepAnonymize(item)) as T;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepAnonymize(v)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

export function anonymizeFiles(files: Record<string, SqlFile>): Record<string, SqlFile> {
  if (!DEMO_MODE_ENABLED) return files;
  return Object.fromEntries(
    Object.entries(files).map(([path, file]) => [
      anonymizeText(path),
      {
        ...file,
        content: anonymizeText(file.content),
        savedContent: anonymizeText(file.savedContent),
      },
    ])
  );
}
