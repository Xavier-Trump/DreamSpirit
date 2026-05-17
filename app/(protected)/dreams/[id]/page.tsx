import { JSONContent } from "@tiptap/core";
import { notFound, redirect } from "next/navigation";

import { DeleteDreamButton } from "@/components/delete-dream-button";
import { DreamActions } from "@/components/dream-actions";
import { DreamForm } from "@/components/dream-form";
import { hasUsableAiConfig } from "@/lib/ai-config";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { getUserEmotionOptions } from "@/lib/dream-preferences";
import { getDreamById } from "@/lib/dreams";
import { formatDateTime } from "@/lib/utils";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DreamDetailPage({ params }: PageProps) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const [dream, aiConfigured, emotionOptions] = await Promise.all([
    getDreamById(viewer.id, id),
    hasUsableAiConfig(viewer.id),
    getUserEmotionOptions(viewer.id)
  ]);

  if (!dream) {
    notFound();
  }

  const imageAsset = dream.assets.find((asset) => asset.type === "IMAGE" && asset.status === "READY");
  const readOnlyMessage = !viewer.canWrite ? getReadOnlyMessage("编辑、删除或触发 AI 任务") : undefined;
  const latestShareReview = dream.moderationReviews[0];

  return (
    <div className="detail-grid">
      <DreamForm
        emotionOptions={emotionOptions}
        mode="edit"
        initialDream={{
          id: dream.id,
          title: dream.title,
          contentRich: dream.contentRich as JSONContent,
          contentPlain: dream.contentPlain,
          dreamedAt: dream.dreamedAt.toISOString(),
          emotions: dream.emotions,
          clarity: dream.clarity,
          isRecurring: dream.isRecurring,
          realityConnection: dream.realityConnection,
          status: dream.status
        }}
        readOnly={!viewer.canWrite}
        readOnlyMessage={readOnlyMessage}
      />

      <div className="stack-lg">
        <DreamActions
          dreamId={dream.id}
          aiConfigured={aiConfigured}
          readOnly={!viewer.canWrite}
          readOnlyMessage={readOnlyMessage}
          shareReview={
            latestShareReview
              ? {
                  notes: latestShareReview.notes,
                  riskFlags: latestShareReview.riskFlags
                }
              : null
          }
          shareStatus={dream.sharedDream?.moderationStatus || null}
        />

        <div className="card stack-md">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
            <div>
              <div className="field-label">记录信息</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>{formatDateTime(dream.dreamedAt)}</div>
            </div>
            <DeleteDreamButton disabled={!viewer.canWrite} disabledMessage={readOnlyMessage} dreamId={dream.id} />
          </div>
          <div className="badge-row">
            {dream.emotions.map((emotion) => (
              <span className="chip" key={`${dream.id}-${emotion}`}>
                {emotion}
              </span>
            ))}
            <span className="chip">清晰度 {dream.clarity}/5</span>
            <span className="chip">状态 {dream.status}</span>
          </div>
          {dream.realityConnection ? <div className="story-block">{dream.realityConnection}</div> : <p className="helper-text">还没有填写现实关联。</p>}
        </div>

        <div className="card stack-md">
          <div>
            <div className="field-label">AI 梦境解析</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>分析结果</div>
          </div>
          {dream.analysis ? (
            <>
              <div className="analysis-block">
                <div style={{ fontWeight: 800, marginBottom: 8 }}>象征解读</div>
                <p className="muted-text">{dream.analysis.symbolism}</p>
              </div>
              <div className="analysis-block">
                <div style={{ fontWeight: 800, marginBottom: 8 }}>情绪分析</div>
                <p className="muted-text">{dream.analysis.emotionAnalysis}</p>
              </div>
              <div className="chip-row">
                {dream.analysis.stressFactors.map((factor) => (
                  <span className="chip" key={factor}>
                    压力源：{factor}
                  </span>
                ))}
                {dream.analysis.themes.map((theme) => (
                  <span className="chip" key={theme}>
                    主题：{theme}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="helper-text">还没有解析结果，点击上方“解析梦境”即可进入任务队列。</p>
          )}
        </div>

        <div className="card stack-md">
          <div>
            <div className="field-label">创意输出</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>故事与图片</div>
          </div>
          {dream.story ? <div className="story-block">{dream.story.content}</div> : <p className="helper-text">还没有创意故事，生成后会持久化保存。</p>}
          {imageAsset ? <img alt="梦境生成图" src={imageAsset.url} style={{ width: "100%", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)" }} /> : <p className="helper-text">还没有图片素材，生成成功后会显示在这里。</p>}
        </div>
      </div>
    </div>
  );
}
