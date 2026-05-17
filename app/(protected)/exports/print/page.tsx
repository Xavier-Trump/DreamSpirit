import { redirect } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { getViewer } from "@/lib/demo";
import { getDreamsByUser } from "@/lib/dreams";
import { formatDateTime } from "@/lib/utils";

export default async function PrintExportPage() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const dreams = await getDreamsByUser(viewer.id);

  return (
    <div className="print-page">
      <div className="print-toolbar">
        <a className="button button-secondary" href="/settings">
          返回设置
        </a>
        <PrintButton />
      </div>

      <article className="print-document">
        <header className="print-cover">
          <div className="field-label">DreamSpirit Export</div>
          <h1>梦境记录报告</h1>
          <p>账号：{viewer.email || viewer.name || "Dreamer"}</p>
          <p>导出时间：{formatDateTime(new Date())}</p>
          <p>记录总数：{dreams.length}</p>
        </header>

        {dreams.map((dream, index) => (
          <section className="print-dream" key={dream.id}>
            <h2>
              {index + 1}. {dream.title}
            </h2>
            <dl>
              <div>
                <dt>时间</dt>
                <dd>{formatDateTime(dream.dreamedAt)}</dd>
              </div>
              <div>
                <dt>情绪</dt>
                <dd>{dream.emotions.join("、") || "无"}</dd>
              </div>
              <div>
                <dt>清晰度</dt>
                <dd>{dream.clarity}/5</dd>
              </div>
              <div>
                <dt>重复梦境</dt>
                <dd>{dream.isRecurring ? "是" : "否"}</dd>
              </div>
            </dl>

            <h3>梦境内容</h3>
            <p>{dream.contentPlain}</p>

            <h3>现实关联</h3>
            <p>{dream.realityConnection || "暂无"}</p>

            {dream.analysis ? (
              <>
                <h3>AI 象征解读</h3>
                <p>{dream.analysis.symbolism}</p>

                <h3>情绪分析</h3>
                <p>{dream.analysis.emotionAnalysis}</p>

                <h3>压力源与主题</h3>
                <p>压力源：{dream.analysis.stressFactors.join("、") || "暂无"}</p>
                <p>主题：{dream.analysis.themes.join("、") || "暂无"}</p>
              </>
            ) : null}

            {dream.story ? (
              <>
                <h3>创意故事</h3>
                <p>{dream.story.content}</p>
              </>
            ) : null}
          </section>
        ))}
      </article>
    </div>
  );
}
