import { NextResponse } from "next/server";

import { getViewer } from "@/lib/demo";
import { getDreamsByUser } from "@/lib/dreams";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dreams = await getDreamsByUser(viewer.id);

  const markdown = dreams
    .map((dream) => {
      const analysis = dream.analysis
        ? `## AI 分析

### 象征解读
${dream.analysis.symbolism}

### 情绪分析
${dream.analysis.emotionAnalysis}

### 潜在压力源
${dream.analysis.stressFactors.map((item) => `- ${item}`).join("\n")}

### 主题标签
${dream.analysis.themes.map((item) => `- ${item}`).join("\n")}`
        : "";

      return `# ${dream.title}

- 时间：${dream.dreamedAt.toISOString()}
- 情绪：${dream.emotions.join("、") || "无"}
- 清晰度：${dream.clarity}/5
- 重复梦境：${dream.isRecurring ? "是" : "否"}

## 梦境内容
${dream.contentPlain}

## 现实关联
${dream.realityConnection || "暂无"}

${analysis}
`;
    })
    .join("\n\n---\n\n");

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dreamspirit-export.md"'
    }
  });
}
