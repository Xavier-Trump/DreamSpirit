import { JobType } from "@prisma/client";
import { NextResponse } from "next/server";

import { hasUsableAiConfig } from "@/lib/ai-config";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { getDreamById } from "@/lib/dreams";
import { enqueueJob, mapJobStatus } from "@/lib/jobs";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: Context) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("生成创意故事") }, { status: 403 });
  }
  if (!(await hasUsableAiConfig(viewer.id))) {
    return NextResponse.json({ error: "AI API Key 未配置。请先到设置页填写 AI API 配置。" }, { status: 400 });
  }
  const { id } = await context.params;
  const dream = await getDreamById(viewer.id, id);

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  const job = await enqueueJob({
    type: JobType.GENERATE_STORY,
    userId: viewer.id,
    dreamId: dream.id,
    payload: { dreamId: dream.id }
  });

  return NextResponse.json({ jobId: job.id, status: mapJobStatus(job.status) }, { status: 202 });
}
