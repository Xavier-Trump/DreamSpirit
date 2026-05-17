import { NextResponse } from "next/server";

import { getApprovedSharedDreams } from "@/lib/community";

export async function GET() {
  const dreams = await getApprovedSharedDreams();
  return NextResponse.json(
    dreams.map((dream) => ({
      id: dream.id,
      title: dream.title,
      excerpt: dream.excerpt,
      contentPublic: dream.contentPublic,
      emotions: dream.emotions,
      themes: dream.themes,
      publishedAt: dream.publishedAt?.toISOString() ?? null,
      dreamedAt: dream.sourceDream.dreamedAt.toISOString()
    }))
  );
}
