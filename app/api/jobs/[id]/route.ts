import { NextResponse } from "next/server";

import { getViewer } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { mapJobStatus } from "@/lib/jobs";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  const viewer = await getViewer();

  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const job = await prisma.job.findFirst({
    where: {
      id,
      userId: viewer.id
    }
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    type: job.type,
    status: mapJobStatus(job.status),
    output: job.output,
    error: job.error,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null
  });
}
