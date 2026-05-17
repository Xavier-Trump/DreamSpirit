import type { Dream, DreamAnalysis, DreamAsset, DreamElement, DreamStory, SharedDream } from "@prisma/client";

export type DreamWithRelations = Dream & {
  analysis: DreamAnalysis | null;
  story: DreamStory | null;
  assets: DreamAsset[];
  elements: DreamElement[];
  sharedDream: SharedDream | null;
};

export function serializeDream(dream: DreamWithRelations) {
  return {
    id: dream.id,
    title: dream.title,
    contentRich: dream.contentRich,
    contentPlain: dream.contentPlain,
    dreamedAt: dream.dreamedAt.toISOString(),
    emotions: dream.emotions,
    clarity: dream.clarity,
    isRecurring: dream.isRecurring,
    realityConnection: dream.realityConnection,
    status: dream.status,
    createdAt: dream.createdAt.toISOString(),
    updatedAt: dream.updatedAt.toISOString(),
    analysis: dream.analysis
      ? {
          ...dream.analysis,
          createdAt: dream.analysis.createdAt.toISOString(),
          updatedAt: dream.analysis.updatedAt.toISOString()
        }
      : null,
    story: dream.story
      ? {
          ...dream.story,
          createdAt: dream.story.createdAt.toISOString(),
          updatedAt: dream.story.updatedAt.toISOString()
        }
      : null,
    assets: dream.assets.map((asset) => ({
      ...asset,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString()
    })),
    elements: dream.elements.map((element) => ({
      ...element,
      createdAt: element.createdAt.toISOString()
    })),
    sharedDream: dream.sharedDream
      ? {
          ...dream.sharedDream,
          createdAt: dream.sharedDream.createdAt.toISOString(),
          updatedAt: dream.sharedDream.updatedAt.toISOString(),
          publishedAt: dream.sharedDream.publishedAt?.toISOString() ?? null
        }
      : null
  };
}
