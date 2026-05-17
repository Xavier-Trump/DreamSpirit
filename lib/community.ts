import { prisma } from "@/lib/prisma";

export async function getApprovedSharedDreams() {
  return prisma.sharedDream.findMany({
    where: {
      moderationStatus: "APPROVED"
    },
    include: {
      sourceDream: {
        select: {
          dreamedAt: true
        }
      }
    },
    orderBy: {
      publishedAt: "desc"
    }
  });
}

export async function getRecentUniverseStories() {
  return prisma.universeStory.findMany({
    where: {
      status: "READY"
    },
    include: {
      sources: {
        include: {
          sharedDream: true
        }
      }
    },
    orderBy: {
      generatedAt: "desc"
    },
    take: 5
  });
}
