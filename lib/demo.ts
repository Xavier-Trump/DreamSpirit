import { cache } from "react";

import { auth } from "@/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const DEMO_READ_ONLY_MESSAGE =
  "当前为访客浏览模式，仅开放读取与浏览能力。";

export type Viewer = {
  id: string;
  email: string | null;
  name: string | null;
  isGuest: boolean;
  isDemoMode: boolean;
  canWrite: boolean;
};

export function isDemoModeEnabled() {
  return env.DEMO_MODE;
}

export function getReadOnlyMessage(action?: string) {
  if (!action) {
    return DEMO_READ_ONLY_MESSAGE;
  }

  return `访客浏览模式暂不支持${action}。`;
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();

  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      isGuest: false,
      isDemoMode: env.DEMO_MODE,
      canWrite: !env.DEMO_MODE
    };
  }

  if (!env.DEMO_MODE) {
    return null;
  }

  const demoUser = await prisma.user.findUnique({
    where: {
      email: env.DEMO_USER_EMAIL
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  if (!demoUser) {
    return null;
  }

  return {
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name,
    isGuest: true,
    isDemoMode: true,
    canWrite: false
  };
});
