import { NextResponse } from "next/server";
import { saveFile } from "@/lib/git-service";

export async function POST(request: Request) {
  try {
    const { filePath, content } = await request.json();
    await saveFile(filePath, content);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
