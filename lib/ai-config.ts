import { z } from "zod";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const aiConfigSchema = z.object({
  provider: z.string().trim().min(1).max(40).default("doubao"),
  apiKey: z.string().trim().optional(),
  chatModel: z.string().trim().min(1).max(160),
  imageModel: z.string().trim().min(1).max(160),
  chatEndpoint: z.string().trim().url().max(500),
  imageEndpoint: z.string().trim().url().max(500)
});

export type RuntimeAiConfig = z.infer<typeof aiConfigSchema>;

export function getEnvAiConfig(): RuntimeAiConfig {
  return {
    provider: env.AI_PROVIDER,
    apiKey: env.DOUBAO_API_KEY || "",
    chatModel: env.DOUBAO_CHAT_MODEL,
    imageModel: env.DOUBAO_IMAGE_MODEL,
    chatEndpoint: env.DOUBAO_ENDPOINT,
    imageEndpoint: env.DOUBAO_IMAGE_ENDPOINT
  };
}

export function maskApiKey(apiKey?: string | null) {
  if (!apiKey) {
    return "";
  }

  if (apiKey.length <= 8) {
    return "••••";
  }

  return `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}`;
}

export async function getUserAiConfig(userId: string) {
  return prisma.userAiConfig.findUnique({
    where: {
      userId
    }
  });
}

export async function getRuntimeAiConfig(userId?: string | null): Promise<RuntimeAiConfig> {
  const fallback = getEnvAiConfig();

  if (!userId) {
    return fallback;
  }

  const saved = await getUserAiConfig(userId);
  if (!saved) {
    return fallback;
  }

  return {
    provider: saved.provider || fallback.provider,
    apiKey: saved.apiKey || fallback.apiKey,
    chatModel: saved.chatModel || fallback.chatModel,
    imageModel: saved.imageModel || fallback.imageModel,
    chatEndpoint: saved.chatEndpoint || fallback.chatEndpoint,
    imageEndpoint: saved.imageEndpoint || fallback.imageEndpoint
  };
}

export async function hasUsableAiConfig(userId?: string | null) {
  const config = await getRuntimeAiConfig(userId);
  return Boolean(config.apiKey);
}

export async function upsertUserAiConfig(userId: string, input: RuntimeAiConfig) {
  const current = await getUserAiConfig(userId);
  const fallback = getEnvAiConfig();
  const apiKey = input.apiKey === undefined || input.apiKey === "" ? current?.apiKey ?? fallback.apiKey : input.apiKey;

  return prisma.userAiConfig.upsert({
    where: {
      userId
    },
    update: {
      provider: input.provider,
      apiKey,
      chatModel: input.chatModel,
      imageModel: input.imageModel,
      chatEndpoint: input.chatEndpoint,
      imageEndpoint: input.imageEndpoint
    },
    create: {
      userId,
      provider: input.provider,
      apiKey,
      chatModel: input.chatModel,
      imageModel: input.imageModel,
      chatEndpoint: input.chatEndpoint,
      imageEndpoint: input.imageEndpoint
    }
  });
}

export function toSafeAiConfigResponse(config?: RuntimeAiConfig | null) {
  const fallback = getEnvAiConfig();
  const value = config ?? fallback;

  return {
    provider: value.provider,
    hasApiKey: Boolean(value.apiKey),
    maskedApiKey: maskApiKey(value.apiKey),
    chatModel: value.chatModel,
    imageModel: value.imageModel,
    chatEndpoint: value.chatEndpoint,
    imageEndpoint: value.imageEndpoint
  };
}
