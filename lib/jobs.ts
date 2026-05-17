import { JobStatus, JobType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function enqueueJob(input: {
  type: JobType;
  userId?: string;
  dreamId?: string;
  payload: Prisma.InputJsonValue;
  maxAttempts?: number;
}) {
  const job = await prisma.job.create({
    data: {
      type: input.type,
      userId: input.userId,
      dreamId: input.dreamId,
      payload: input.payload,
      maxAttempts: input.maxAttempts ?? 3
    }
  });

  await createAuditLog({
    userId: input.userId,
    action: "JOB_ENQUEUED",
    targetType: "job",
    targetId: job.id,
    metadata: { type: input.type }
  });

  return job;
}

export async function getRunnableJobs(limit = 10) {
  return prisma.job.findMany({
    where: {
      status: "QUEUED",
      runAfter: {
        lte: new Date()
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    take: limit
  });
}

export async function markJobRunning(jobId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      attempts: {
        increment: 1
      }
    }
  });
}

export async function markJobSucceeded(jobId: string, output?: Prisma.InputJsonValue) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "SUCCEEDED",
      output,
      completedAt: new Date()
    }
  });

  await createAuditLog({
    userId: job.userId,
    action: "JOB_COMPLETED",
    targetType: "job",
    targetId: job.id,
    metadata: { type: job.type }
  });

  return job;
}

export async function markJobFailed(jobId: string, error: string) {
  const current = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!current) {
    return null;
  }

  const canRetry = current.attempts < current.maxAttempts;

  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: canRetry ? "QUEUED" : "FAILED",
      error,
      runAfter: canRetry ? new Date(Date.now() + current.attempts * 30_000) : current.runAfter,
      completedAt: canRetry ? null : new Date(),
      startedAt: null
    }
  });

  if (!canRetry) {
    await createAuditLog({
      userId: job.userId,
      action: "JOB_FAILED",
      targetType: "job",
      targetId: job.id,
      metadata: { type: job.type, error }
    });
  }

  return job;
}

export function mapJobStatus(status: JobStatus) {
  return status.toLowerCase();
}
