import { JobType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hasUsableAiConfig } from "@/lib/ai-config";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { enqueueJob, mapJobStatus } from "@/lib/jobs";

const universeSchema = z.object({
  sharedDreamIds: z.array(z.string()).min(3).max(5)
});

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("生成公共梦境宇宙") }, { status: 403 });
  }
  if (!(await hasUsableAiConfig(viewer.id))) {
    return NextResponse.json({ error: "AI API Key 未配置。请先到设置页填写 AI API 配置。" }, { status: 400 });
  }
  const parsed = universeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Please select 3-5 approved shared dreams" }, { status: 400 });
  }

  const job = await enqueueJob({
    type: JobType.GENERATE_UNIVERSE,
    userId: viewer.id,
    payload: {
      sharedDreamIds: parsed.data.sharedDreamIds
    }
  });

  return NextResponse.json({ jobId: job.id, status: mapJobStatus(job.status) }, { status: 202 });
}
