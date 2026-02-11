import { NextResponse } from "next/server";
import { initRepo } from "@/lib/git-service";

export async function POST() {
  try {
    const result = await initRepo();
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
