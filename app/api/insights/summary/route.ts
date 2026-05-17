import { NextResponse } from "next/server";

import { getViewer } from "@/lib/demo";
import { getInsightSummary } from "@/lib/insights";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await getInsightSummary(viewer.id);
  return NextResponse.json(summary);
}
