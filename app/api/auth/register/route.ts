import { NextResponse } from "next/server";
import { z } from "zod";

import { isDemoModeEnabled } from "@/lib/demo";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  if (isDemoModeEnabled()) {
    return NextResponse.json({ error: "访客浏览模式暂不开放注册。" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (existing) {
    return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      anonymousProfile: `dreamer-${Math.random().toString(36).slice(2, 8)}`
    }
  });

  return NextResponse.json({
    id: user.id,
    email: user.email
  });
}
