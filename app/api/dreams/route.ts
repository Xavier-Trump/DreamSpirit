import { NextResponse } from "next/server";

import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { getDreamsByUser, dreamSchema } from "@/lib/dreams";
import { prisma } from "@/lib/prisma";
import { serializeDream } from "@/lib/serialize";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dreams = await getDreamsByUser(viewer.id);
  return NextResponse.json(dreams.map(serializeDream));
}

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("创建梦境") }, { status: 403 });
  }
  const parsed = dreamSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid dream payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const dream = await prisma.dream.create({
    data: {
      userId: viewer.id,
      ...parsed.data,
      contentRich: parsed.data.contentRich as object
    },
    include: {
      analysis: true,
      story: true,
      assets: true,
      elements: true,
      sharedDream: true
    }
  });

  await createAuditLog({
    userId: viewer.id,
    action: "DREAM_CREATED",
    targetType: "dream",
    targetId: dream.id
  });

  return NextResponse.json(serializeDream(dream), { status: 201 });
}
