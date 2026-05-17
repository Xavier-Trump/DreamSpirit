import { AuditAction } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createAuditLog(input: {
  userId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata as object | undefined
    }
  });
}
