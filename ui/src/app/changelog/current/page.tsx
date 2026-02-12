import Link from "next/link";
import { getCurrentChangelogPdf } from "@/lib/changelog-pdf";

export const dynamic = "force-dynamic";

export default async function CurrentChangelogPage() {
  const current = await getCurrentChangelogPdf();

  if (!current) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6">
        <h1 className="text-lg font-semibold">Current Changelog PDF</h1>
        <p className="text-sm text-text-secondary mt-2">
          No phase PDF found in <code>docs/changelogs</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-semibold">Current Changelog PDF</h1>
          <p className="text-xs text-text-secondary mt-1">{current.fileName}</p>
        </div>
        <Link
          href="/api/changelog/current-pdf"
          target="_blank"
          className="text-xs px-3 py-1.5 rounded-md border border-sidebar-border hover:bg-surface-hover"
        >
          Open in new tab
        </Link>
      </div>

      <div className="border border-sidebar-border rounded-md overflow-hidden bg-surface">
        <iframe
          src="/api/changelog/current-pdf"
          title="Current changelog PDF"
          className="w-full h-[82vh]"
        />
      </div>
    </main>
  );
}
