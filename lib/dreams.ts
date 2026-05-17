import { DreamStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const richContentSchema = z.object({
  type: z.string(),
  content: z.array(z.unknown()).optional()
});

export const dreamSchema = z.object({
  title: z.string().min(1).max(120),
  contentRich: richContentSchema,
  contentPlain: z.string().min(1),
  dreamedAt: z.string().datetime(),
  emotions: z.array(z.string()).max(8),
  clarity: z.number().min(1).max(5),
  isRecurring: z.boolean().default(false),
  realityConnection: z.string().max(4000).optional().nullable(),
  status: z.nativeEnum(DreamStatus).default(DreamStatus.ACTIVE)
});

export async function getDreamsByUser(userId: string) {
  return prisma.dream.findMany({
    where: {
      userId,
      status: {
        not: "DELETED"
      }
    },
    include: {
      analysis: true,
      story: true,
      assets: true,
      elements: true,
      sharedDream: true
    },
    orderBy: {
      dreamedAt: "desc"
    }
  });
}

export async function getDreamById(userId: string, id: string) {
  return prisma.dream.findFirst({
    where: {
      id,
      userId,
      status: {
        not: "DELETED"
      }
    },
    include: {
      analysis: true,
      story: true,
      assets: true,
      elements: true,
      sharedDream: true,
      moderationReviews: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });
}
