import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getCurrentChangelogPdf } from "@/lib/changelog-pdf";

export const runtime = "nodejs";

export async function GET() {
  const current = await getCurrentChangelogPdf();
  if (!current) {
    return NextResponse.json(
      { error: "No changelog PDF found for current workspace" },
      { status: 404 }
    );
  }

  const data = await readFile(current.absolutePath);

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${current.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
