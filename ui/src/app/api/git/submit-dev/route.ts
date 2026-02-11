import { NextResponse } from "next/server";
import { submitToDev } from "@/lib/git-service";

export async function POST(request: Request) {
  try {
    const { filePath, content, message } = await request.json();
    const result = await submitToDev(filePath, content, message);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
