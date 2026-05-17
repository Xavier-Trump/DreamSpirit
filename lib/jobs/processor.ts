import { AssetType, AssetStatus, Job, JobType, SharedDreamStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { aiProvider } from "@/lib/ai/provider";
import { moderateSharedDreamLocally } from "@/lib/share-moderation";
import { saveBase64Asset } from "@/lib/storage";

export async function processJob(job: Job) {
  switch (job.type) {
    case JobType.TRANSCRIBE:
      return handleTranscribe(job);
    case JobType.ANALYZE_DREAM:
      return handleAnalyzeDream(job);
    case JobType.GENERATE_STORY:
      return handleGenerateStory(job);
    case JobType.GENERATE_IMAGE:
      return handleGenerateImage(job);
    case JobType.MODERATE_SHARE:
      return handleModerateShare(job);
    case JobType.GENERATE_UNIVERSE:
      return handleGenerateUniverse(job);
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}

async function handleTranscribe(job: Job) {
  const payload = job.payload as { dreamId?: string };
  if (!payload.dreamId) {
    throw new Error("Missing dreamId for transcription");
  }

  const transcript = "服务端录音转写尚未启用，请使用实时语音听写补充正文。";

  await prisma.dream.update({
    where: { id: payload.dreamId },
    data: {
      contentPlain: transcript,
      contentRich: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: transcript
              }
            ]
          }
        ]
      }
    }
  });

  return { transcript };
}

async function handleAnalyzeDream(job: Job) {
  if (!job.dreamId) {
    throw new Error("Missing dreamId");
  }

  const dream = await prisma.dream.findUnique({
    where: { id: job.dreamId }
  });

  if (!dream) {
    throw new Error("Dream not found");
  }

  const analysis = await aiProvider.analyzeDream({
    userId: job.userId,
    title: dream.title,
    content: dream.contentPlain,
    emotions: dream.emotions,
    clarity: dream.clarity
  });

  const elements = await aiProvider.extractElements({
    userId: job.userId,
    title: dream.title,
    content: dream.contentPlain
  });

  const characters = elements.characters ?? [];
  const locations = elements.locations ?? [];
  const objects = elements.objects ?? [];
  const actions = elements.actions ?? [];

  await prisma.$transaction([
    prisma.dreamAnalysis.upsert({
      where: { dreamId: dream.id },
      update: {
        ...analysis,
        provider: "doubao",
        version: "v1",
        status: "COMPLETED"
      },
      create: {
        dreamId: dream.id,
        ...analysis,
        provider: "doubao",
        version: "v1",
        status: "COMPLETED"
      }
    }),
    prisma.dreamElement.deleteMany({
      where: { dreamId: dream.id }
    }),
    prisma.dreamElement.createMany({
      data: [
        ...characters.map((value) => ({ dreamId: dream.id, type: "character", value, normalized: value })),
        ...locations.map((value) => ({ dreamId: dream.id, type: "location", value, normalized: value })),
        ...objects.map((value) => ({ dreamId: dream.id, type: "object", value, normalized: value })),
        ...actions.map((value) => ({ dreamId: dream.id, type: "action", value, normalized: value }))
      ]
    })
  ]);

  return { analysis, elements };
}

async function handleGenerateStory(job: Job) {
  if (!job.dreamId) {
    throw new Error("Missing dreamId");
  }

  const dream = await prisma.dream.findUnique({
    where: { id: job.dreamId }
  });

  if (!dream) {
    throw new Error("Dream not found");
  }

  const story = await aiProvider.generateStory({
    userId: job.userId,
    title: dream.title,
    content: dream.contentPlain,
    emotions: dream.emotions
  });

  await prisma.dreamStory.upsert({
    where: {
      dreamId: dream.id
    },
    update: {
      content: story
    },
    create: {
      dreamId: dream.id,
      content: story
    }
  });

  return { story };
}

async function handleGenerateImage(job: Job) {
  if (!job.dreamId) {
    throw new Error("Missing dreamId");
  }

  const dream = await prisma.dream.findUnique({
    where: { id: job.dreamId }
  });

  if (!dream) {
    throw new Error("Dream not found");
  }

  const image = await aiProvider.generateImage({
    userId: job.userId,
    prompt: `${dream.title}。${dream.contentPlain}。氛围：${dream.emotions.join("、") || "梦幻"}`
  });

  let url = image.url;
  let mimeType = image.mimeType;

  if (!url && image.b64) {
    const stored = await saveBase64Asset({
      fileName: `dream-${dream.id}-image`,
      base64: image.b64,
      contentType: image.mimeType
    });
    url = stored.url;
    mimeType = stored.mimeType;
  }

  if (!url) {
    throw new Error("No image URL returned");
  }

  await prisma.dreamAsset.create({
    data: {
      dreamId: dream.id,
      type: AssetType.IMAGE,
      url,
      mimeType,
      status: AssetStatus.READY
    }
  });

  return { imageUrl: url };
}

async function handleModerateShare(job: Job) {
  if (!job.dreamId) {
    throw new Error("Missing dreamId");
  }

  const dream = await prisma.dream.findUnique({
    where: { id: job.dreamId },
    include: {
      analysis: true
    }
  });

  if (!dream) {
    throw new Error("Dream not found");
  }

  const owner = await prisma.user.findUnique({
    where: {
      id: dream.userId
    }
  });

  const moderation = moderateSharedDreamLocally({
    title: dream.title,
    content: dream.contentPlain
  });

  await prisma.$transaction(async (tx) => {
    const sharedDream = await tx.sharedDream.upsert({
      where: { sourceDreamId: dream.id },
      update: {
        title: moderation.title,
        excerpt: moderation.excerpt,
        contentPublic: moderation.content,
        emotions: dream.emotions,
        themes: dream.analysis?.themes ?? [],
        moderationStatus: moderation.sharedStatus,
        publishedAt: moderation.approved ? new Date() : null
      },
      create: {
        sourceDreamId: dream.id,
        anonymousProfileId: owner?.anonymousProfile ?? "moonwalker",
        title: moderation.title,
        excerpt: moderation.excerpt,
        contentPublic: moderation.content,
        emotions: dream.emotions,
        themes: dream.analysis?.themes ?? [],
        moderationStatus: moderation.sharedStatus,
        publishedAt: moderation.approved ? new Date() : null
      }
    });

    await tx.moderationReview.create({
      data: {
        dreamId: dream.id,
        sharedDreamId: sharedDream.id,
        riskFlags: moderation.riskFlags,
        decision: moderation.decision,
        notes: moderation.notes,
        reviewedAt: new Date()
      }
    });
  });

  return moderation;
}

async function handleGenerateUniverse(job: Job) {
  const payload = job.payload as { sharedDreamIds?: string[] };
  if (!payload.sharedDreamIds?.length) {
    throw new Error("Missing sharedDreamIds");
  }

  const dreams = await prisma.sharedDream.findMany({
    where: {
      id: { in: payload.sharedDreamIds },
      moderationStatus: "APPROVED"
    }
  });

  if (dreams.length < 3) {
    throw new Error("At least 3 approved shared dreams are required");
  }

  const story = await aiProvider.generateUniverseStory({
    userId: job.userId,
    dreams: dreams.map((dream) => ({
      title: dream.title,
      content: dream.contentPublic,
      emotions: dream.emotions
    }))
  });

  const universeStory = await prisma.universeStory.create({
    data: {
      story,
      status: "READY",
      generatedAt: new Date(),
      sources: {
        create: dreams.map((dream, index) => ({
          sharedDreamId: dream.id,
          orderIndex: index
        }))
      }
    },
    include: {
      sources: true
    }
  });

  return {
    universeStoryId: universeStory.id,
    story
  };
}
