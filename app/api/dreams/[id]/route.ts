import { NextResponse } from "next/server";
import { DreamStatus } from "@prisma/client";

import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { dreamSchema, getDreamById } from "@/lib/dreams";
import { prisma } from "@/lib/prisma";
import { serializeDream } from "@/lib/serialize";
import { createAuditLog } from "@/lib/audit";

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
  const dream = await getDreamById(viewer.id, id);

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  return NextResponse.json(serializeDream(dream));
}

export async function PATCH(request: Request, context: Context) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("编辑梦境") }, { status: 403 });
  }
  const { id } = await context.params;
  const parsed = dreamSchema.partial().safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid dream payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await getDreamById(viewer.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  const dream = await prisma.dream.update({
    where: { id },
    data: {
      ...parsed.data,
      contentRich: parsed.data.contentRich as object | undefined
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
    action: dream.status === DreamStatus.ARCHIVED ? "DREAM_ARCHIVED" : "DREAM_UPDATED",
    targetType: "dream",
    targetId: dream.id
  });

  return NextResponse.json(serializeDream(dream));
}

export async function DELETE(_: Request, context: Context) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("删除梦境") }, { status: 403 });
  }
  const { id } = await context.params;
  const existing = await getDreamById(viewer.id, id);

  if (!existing) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  const dream = await prisma.dream.update({
    where: { id },
    data: {
      status: DreamStatus.DELETED
    }
  });

  await createAuditLog({
    userId: viewer.id,
    action: "DREAM_DELETED",
    targetType: "dream",
    targetId: dream.id
  });

  return NextResponse.json({ success: true });
}
