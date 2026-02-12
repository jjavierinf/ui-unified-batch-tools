import path from "path";
import { readdir } from "fs/promises";

export interface ChangelogPdfInfo {
  fileName: string;
  absolutePath: string;
  phase: number;
}

const PHASE_PDF_PATTERN = /phase-(\d+).+\.pdf$/i;

export async function getCurrentChangelogPdf(): Promise<ChangelogPdfInfo | null> {
  const changelogDir = path.resolve(process.cwd(), "../docs/changelogs");

  let entries: string[];
  try {
    entries = await readdir(changelogDir);
  } catch {
    return null;
  }

  const candidates = entries
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .map((fileName) => {
      const match = fileName.match(PHASE_PDF_PATTERN);
      const phase = match ? Number(match[1]) : -1;
      return {
        fileName,
        absolutePath: path.join(changelogDir, fileName),
        phase,
      };
    })
    .filter((item) => item.phase >= 0)
    .sort((a, b) => {
      if (b.phase !== a.phase) return b.phase - a.phase;
      return b.fileName.localeCompare(a.fileName);
    });

  return candidates[0] ?? null;
}
