import { z } from "zod";

import { DEFAULT_DREAM_THEME_RULES, DEFAULT_EMOTION_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const dreamPreferencesSchema = z.object({
  emotions: z.array(z.string().trim().min(1).max(24)).min(1).max(30),
  themeRules: z
    .array(
      z.object({
        key: z.string().trim().max(80).optional(),
        label: z.string().trim().min(1).max(40),
        keywords: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
        enabled: z.boolean().default(true)
      })
    )
    .min(1)
    .max(30)
});

export type DreamPreferencesPayload = z.infer<typeof dreamPreferencesSchema>;

export type DreamThemeRule = {
  key: string;
  label: string;
  keywords: string[];
  enabled: boolean;
};

function uniqueTrimmed(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeKey(value: string, index: number) {
  const ascii = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (ascii) {
    return ascii.slice(0, 80);
  }

  return `custom-${index + 1}`;
}

export async function ensureUserDreamPreferences(userId: string) {
  const [emotionCount, themeRuleCount] = await Promise.all([
    prisma.userEmotionOption.count({ where: { userId } }),
    prisma.userThemeRule.count({ where: { userId } })
  ]);

  if (emotionCount === 0) {
    await prisma.userEmotionOption.createMany({
      data: DEFAULT_EMOTION_OPTIONS.map((label, index) => ({
        userId,
        label,
        sortOrder: index
      })),
      skipDuplicates: true
    });
  }

  if (themeRuleCount === 0) {
    await prisma.userThemeRule.createMany({
      data: DEFAULT_DREAM_THEME_RULES.map((rule, index) => ({
        userId,
        key: rule.key,
        label: rule.label,
        keywords: rule.keywords,
        sortOrder: index
      })),
      skipDuplicates: true
    });
  }
}

export async function getUserEmotionOptions(userId: string) {
  await ensureUserDreamPreferences(userId);

  const options = await prisma.userEmotionOption.findMany({
    where: {
      userId,
      enabled: true
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return options.map((option) => option.label);
}

export async function getUserThemeRules(userId: string) {
  await ensureUserDreamPreferences(userId);

  const rules = await prisma.userThemeRule.findMany({
    where: {
      userId,
      enabled: true
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return rules.map((rule) => ({
    key: rule.key,
    label: rule.label,
    keywords: rule.keywords,
    enabled: rule.enabled
  }));
}

export async function getUserDreamPreferences(userId: string) {
  await ensureUserDreamPreferences(userId);

  const [emotions, themeRules] = await Promise.all([
    prisma.userEmotionOption.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    }),
    prisma.userThemeRule.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);

  return {
    emotions: emotions.filter((option) => option.enabled).map((option) => option.label),
    themeRules: themeRules.map((rule) => ({
      key: rule.key,
      label: rule.label,
      keywords: rule.keywords,
      enabled: rule.enabled
    }))
  };
}

export async function replaceUserDreamPreferences(userId: string, payload: DreamPreferencesPayload) {
  const parsed = dreamPreferencesSchema.parse(payload);
  const emotions = uniqueTrimmed(parsed.emotions);
  const usedKeys = new Set<string>();
  const themeRules: DreamThemeRule[] = parsed.themeRules.map((rule, index) => {
    let key = normalizeKey(rule.key || rule.label, index);
    while (usedKeys.has(key)) {
      key = `${key}-${index + 1}`;
    }
    usedKeys.add(key);

    return {
      key,
      label: rule.label.trim(),
      keywords: uniqueTrimmed(rule.keywords),
      enabled: rule.enabled
    };
  });

  await prisma.$transaction([
    prisma.userEmotionOption.deleteMany({ where: { userId } }),
    prisma.userThemeRule.deleteMany({ where: { userId } }),
    prisma.userEmotionOption.createMany({
      data: emotions.map((label, index) => ({
        userId,
        label,
        sortOrder: index
      }))
    }),
    prisma.userThemeRule.createMany({
      data: themeRules.map((rule, index) => ({
        userId,
        key: rule.key,
        label: rule.label,
        keywords: rule.keywords,
        enabled: rule.enabled,
        sortOrder: index
      }))
    })
  ]);

  return {
    emotions,
    themeRules
  };
}
