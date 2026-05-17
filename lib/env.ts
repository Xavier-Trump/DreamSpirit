import { z } from "zod";

const booleanish = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off", ""].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().min(1),
  DEMO_MODE: booleanish.default(false),
  DEMO_USER_EMAIL: z.string().email().default("dreamer@dreamspirit.local"),
  AI_PROVIDER: z.string().default("doubao"),
  DOUBAO_API_KEY: z.string().optional(),
  DOUBAO_CHAT_MODEL: z.string().default("ep-20260130043458-8fvmf"),
  DOUBAO_IMAGE_MODEL: z.string().default("doubao-seedream-4-5-251128"),
  DOUBAO_ENDPOINT: z.string().default("https://ark.cn-beijing.volces.com/api/v3/chat/completions"),
  DOUBAO_IMAGE_ENDPOINT: z.string().default("https://ark.cn-beijing.volces.com/api/v3/images/generations"),
  STORAGE_MODE: z.enum(["local", "s3"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("./tmp/uploads")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  DEMO_MODE: process.env.DEMO_MODE,
  DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL,
  AI_PROVIDER: process.env.AI_PROVIDER,
  DOUBAO_API_KEY: process.env.DOUBAO_API_KEY,
  DOUBAO_CHAT_MODEL: process.env.DOUBAO_CHAT_MODEL,
  DOUBAO_IMAGE_MODEL: process.env.DOUBAO_IMAGE_MODEL,
  DOUBAO_ENDPOINT: process.env.DOUBAO_ENDPOINT,
  DOUBAO_IMAGE_ENDPOINT: process.env.DOUBAO_IMAGE_ENDPOINT,
  STORAGE_MODE: process.env.STORAGE_MODE,
  LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR
});
