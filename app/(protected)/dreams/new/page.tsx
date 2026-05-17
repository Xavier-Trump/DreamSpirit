import { redirect } from "next/navigation";

import { DreamForm } from "@/components/dream-form";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { getUserEmotionOptions } from "@/lib/dream-preferences";

export default async function NewDreamPage() {
  const viewer = await getViewer();

  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const emotionOptions = await getUserEmotionOptions(viewer.id);

  return (
    <DreamForm
      emotionOptions={emotionOptions}
      mode="create"
      readOnly={!viewer.canWrite}
      readOnlyMessage={!viewer.canWrite ? getReadOnlyMessage("创建和保存梦境") : undefined}
    />
  );
}
