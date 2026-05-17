import { NextResponse } from "next/server";

import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { aiConfigSchema, getRuntimeAiConfig, toSafeAiConfigResponse, upsertUserAiConfig } from "@/lib/ai-config";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getRuntimeAiConfig(viewer.id);
  return NextResponse.json(toSafeAiConfigResponse(config));
}

export async function PUT(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("保存 AI API 配置") }, { status: 403 });
  }

  const parsed = aiConfigSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI config payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const saved = await upsertUserAiConfig(viewer.id, parsed.data);
  return NextResponse.json(
    toSafeAiConfigResponse({
      provider: saved.provider,
      apiKey: saved.apiKey || "",
      chatModel: saved.chatModel,
      imageModel: saved.imageModel,
      chatEndpoint: saved.chatEndpoint,
      imageEndpoint: saved.imageEndpoint
    })
  );
}
