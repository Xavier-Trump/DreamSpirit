import { z } from "zod";

import { getRuntimeAiConfig, RuntimeAiConfig } from "@/lib/ai-config";

const dreamAnalysisSchema = z.object({
  symbolism: z.string(),
  emotionAnalysis: z.string(),
  stressFactors: z.array(z.string()).default([]),
  themes: z.array(z.string()).default([]),
  patternSignals: z.array(z.string()).default([])
});

const elementSchema = z.object({
  characters: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  objects: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([])
});

async function callDoubao(messages: Array<{ role: "system" | "user"; content: string }>, config: RuntimeAiConfig) {
  if (!config.apiKey) {
    throw new Error("Missing AI API Key. 请先到设置页填写 AI API 配置。");
  }

  const response = await fetch(config.chatEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.chatModel,
      messages
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Doubao request failed");
  }

  return data.choices?.[0]?.message?.content as string;
}

function parseJsonPayload<T>(raw: string, schema: z.ZodSchema<T>) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Model response did not contain JSON");
  }
  return schema.parse(JSON.parse(match[0]));
}

export const aiProvider = {
  async analyzeDream(input: { userId?: string | null; title: string; content: string; emotions: string[]; clarity: number }) {
    const config = await getRuntimeAiConfig(input.userId);
    const raw = await callDoubao([
      {
        role: "system",
        content: "你是一位兼具心理学和叙事分析能力的梦境分析师。请只输出JSON。"
      },
      {
        role: "user",
        content: `请分析以下梦境并输出 JSON：
{
  "symbolism": "象征解读",
  "emotionAnalysis": "情绪分析",
  "stressFactors": ["压力源"],
  "themes": ["主题"],
  "patternSignals": ["模式信号"]
}

标题：${input.title}
情绪：${input.emotions.join("、") || "无"}
清晰度：${input.clarity}/5
内容：${input.content}`
      }
    ], config);

    return parseJsonPayload(raw, dreamAnalysisSchema);
  },

  async extractElements(input: { userId?: string | null; title: string; content: string }) {
    const config = await getRuntimeAiConfig(input.userId);
    const raw = await callDoubao([
      {
        role: "system",
        content: "你是一位梦境内容标注员。请只输出JSON。"
      },
      {
        role: "user",
        content: `请提取梦境中的人物、地点、物品、动作，并输出 JSON：
{
  "characters": ["人物"],
  "locations": ["地点"],
  "objects": ["物品"],
  "actions": ["动作"]
}

标题：${input.title}
内容：${input.content}`
      }
    ], config);

    return parseJsonPayload(raw, elementSchema);
  },

  async generateStory(input: { userId?: string | null; title: string; content: string; emotions: string[] }) {
    const config = await getRuntimeAiConfig(input.userId);
    return callDoubao([
      {
        role: "system",
        content: "你是一位擅长梦境改编的中文小说家。"
      },
      {
        role: "user",
        content: `请将这段梦境改编成 300-500 字的短篇故事或诗性散文。
标题：${input.title}
情绪：${input.emotions.join("、") || "无"}
内容：${input.content}`
      }
    ], config);
  },

  async moderateShare(input: { userId?: string | null; title: string; content: string }) {
    const config = await getRuntimeAiConfig(input.userId);
    const raw = await callDoubao([
      {
        role: "system",
        content: "你是一位内容审核助手。请只输出JSON。"
      },
      {
        role: "user",
        content: `判断以下内容是否适合匿名公开分享，输出 JSON：
{
  "approved": true,
  "riskFlags": ["风险标签"],
  "notes": "原因说明"
}

标题：${input.title}
内容：${input.content}`
      }
    ], config);

    return parseJsonPayload(
      raw,
      z.object({
        approved: z.boolean(),
        riskFlags: z.array(z.string()).default([]),
        notes: z.string().default("")
      })
    );
  },

  async generateUniverseStory(input: { userId?: string | null; dreams: Array<{ title: string; content: string; emotions: string[] }> }) {
    const config = await getRuntimeAiConfig(input.userId);
    const merged = input.dreams
      .map(
        (dream, index) =>
          `【梦境 ${index + 1}】
标题：${dream.title}
情绪：${dream.emotions.join("、") || "无"}
内容：${dream.content}`
      )
      .join("\n\n");

    return callDoubao([
      {
        role: "system",
        content: "你是一位擅长超现实叙事的长篇故事创作者。"
      },
      {
        role: "user",
        content: `请根据以下多个梦境，创作一篇 1800-2500 字的连贯梦境宇宙故事：

${merged}`
      }
    ], config);
  },

  async generateImage(input: { userId?: string | null; prompt: string }) {
    const config = await getRuntimeAiConfig(input.userId);
    if (!config.apiKey) {
      throw new Error("Missing AI API Key. 请先到设置页填写 AI API 配置。");
    }

    const response = await fetch(config.imageEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.imageModel,
        prompt: input.prompt,
        response_format: "url",
        size: "1024x1024",
        stream: false,
        watermark: true
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message ?? "Image generation failed");
    }

    const url = data.data?.[0]?.url ?? data.images?.[0]?.url ?? data.url;
    const b64 = data.data?.[0]?.b64_json;

    return {
      url,
      b64,
      mimeType: "image/png"
    };
  }
};
