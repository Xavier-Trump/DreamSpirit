import { NextResponse } from "next/server";

import { dreamPreferencesSchema, getUserDreamPreferences, replaceUserDreamPreferences } from "@/lib/dream-preferences";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await getUserDreamPreferences(viewer.id);
  return NextResponse.json(preferences);
}

export async function PUT(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("保存梦境标签和主题规则") }, { status: 403 });
  }

  const parsed = dreamPreferencesSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid dream preferences payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const saved = await replaceUserDreamPreferences(viewer.id, parsed.data);
  return NextResponse.json(saved);
}
