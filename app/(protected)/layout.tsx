import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getViewer } from "@/lib/demo";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();

  if (!viewer?.id) {
    redirect("/sign-in");
  }

  return (
    <AppShell isDemoMode={viewer.isDemoMode} isGuest={viewer.isGuest} userEmail={viewer.email} userName={viewer.name}>
      {children}
    </AppShell>
  );
}
