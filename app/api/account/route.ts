import { NextResponse } from "next/server";

import { createAuditLog } from "@/lib/audit";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { resetExperienceAccountData } from "@/lib/experience-account";
import { EXPERIENCE_ACCOUNT_EMAIL } from "@/lib/experience-account-constants";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const viewer = await getViewer();

  if (!viewer?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (viewer.email?.toLowerCase() === EXPERIENCE_ACCOUNT_EMAIL) {
    await resetExperienceAccountData(viewer.id);
    return NextResponse.json({ success: true });
  }

  if (!viewer.canWrite) {
    return NextResponse.json({ error: getReadOnlyMessage("注销账号") }, { status: 403 });
  }

  await createAuditLog({
    userId: viewer.id,
    action: "ACCOUNT_DELETED",
    targetType: "user",
    targetId: viewer.id
  });

  await prisma.user.delete({
    where: {
      id: viewer.id
    }
  });

  return NextResponse.json({ success: true });
}
