import { AssetType, AssetStatus, JobType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { getDreamById } from "@/lib/dreams";
import { enqueueJob, mapJobStatus } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

const transcribeSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().default("audio/webm")
});

export async function POST(request: Request, context: Context) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("上传录音并转写") }, { status: 403 });
  }
  const { id } = await context.params;
  const dream = await getDreamById(viewer.id, id);

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  const parsed = transcribeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transcription payload" }, { status: 400 });
  }

  await prisma.dreamAsset.create({
    data: {
      dreamId: dream.id,
      type: AssetType.AUDIO,
      url: parsed.data.audioBase64,
      mimeType: parsed.data.mimeType,
      status: AssetStatus.PENDING
    }
  });

  const job = await enqueueJob({
    type: JobType.TRANSCRIBE,
    userId: viewer.id,
    dreamId: dream.id,
    payload: { dreamId: dream.id }
  });

  return NextResponse.json({ jobId: job.id, status: mapJobStatus(job.status) }, { status: 202 });
}
