import { DreamStatus } from "@prisma/client";

import { getUserThemeRules } from "@/lib/dream-preferences";
import { prisma } from "@/lib/prisma";

function collectBenchmarkCounts(
  dreams: Array<{ contentPlain: string }>,
  benchmarks: Array<{ key: string; label: string; keywords: string[] }>
) {
  return benchmarks.map((benchmark) => ({
    key: benchmark.key,
    label: benchmark.label,
    count: dreams.filter((dream) =>
      benchmark.keywords.some((keyword) => dream.contentPlain.includes(keyword))
    ).length
  }));
}

export async function getInsightSummary(userId: string) {
  const [dreams, themeRules] = await Promise.all([
    prisma.dream.findMany({
      where: {
        userId,
        status: {
          in: [DreamStatus.ACTIVE, DreamStatus.ARCHIVED]
        }
      },
      include: {
        analysis: true,
        elements: true
      },
      orderBy: {
        dreamedAt: "asc"
      }
    }),
    getUserThemeRules(userId)
  ]);

  const emotionMap = new Map<string, number>();
  const themeMap = new Map<string, number>();
  const elementMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();
  const stressMap = new Map<string, number>();
  const recurringClusters = {
    recurring: dreams.filter((dream) => dream.isRecurring).length,
    oneOff: dreams.filter((dream) => !dream.isRecurring).length
  };

  for (const dream of dreams) {
    for (const emotion of dream.emotions) {
      emotionMap.set(emotion, (emotionMap.get(emotion) ?? 0) + 1);
    }

    for (const element of dream.elements) {
      elementMap.set(element.normalized, (elementMap.get(element.normalized) ?? 0) + element.count);
    }

    const month = dream.dreamedAt.toISOString().slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1);

    if (dream.analysis) {
      for (const theme of dream.analysis.themes) {
        themeMap.set(theme, (themeMap.get(theme) ?? 0) + 1);
      }
      for (const factor of dream.analysis.stressFactors) {
        stressMap.set(factor, (stressMap.get(factor) ?? 0) + 1);
      }
    }
  }

  const benchmarkThemes = collectBenchmarkCounts(dreams, themeRules);
  const totalRealityConnections = dreams.filter((dream) => Boolean(dream.realityConnection?.trim())).length;

  return {
    totals: {
      dreams: dreams.length,
      recurringDreams: recurringClusters.recurring,
      realityConnections: totalRealityConnections,
      analyzedDreams: dreams.filter((dream) => dream.analysis).length
    },
    topThemes: [...themeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count })),
    topElements: [...elementMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, count]) => ({ label, count })),
    emotionDistribution: [...emotionMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
    monthlyTrend: [...monthlyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count })),
    stressPatterns: [...stressMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count })),
    benchmarkThemes,
    recurringClusters,
    narrative: {
      summary:
        dreams.length === 0
          ? "当你记录第一条梦境后，这里会逐步生成你的梦境模式报告。"
          : `你当前累计记录了 ${dreams.length} 条梦境，其中 ${recurringClusters.recurring} 条被标记为重复梦境，${totalRealityConnections} 条有现实关联记录。`,
      recommendation:
        benchmarkThemes.some((item) => item.count > 0)
          ? "建议持续记录带有重复场景的梦境，这会让主题映射和压力模式识别更精确稳定。"
          : "目前标准主题样本还少，继续积累内容后，得出的对比分析结果会更有参考价值。"
    }
  };
}
