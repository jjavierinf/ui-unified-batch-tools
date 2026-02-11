import { NextResponse } from "next/server";
import { getStatus } from "@/lib/git-service";

export async function GET() {
  try {
    const status = await getStatus();
    return NextResponse.json(status);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
