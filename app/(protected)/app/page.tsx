import Link from "next/link";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/demo";
import { getDreamsByUser } from "@/lib/dreams";
import { formatDateTime, truncateText } from "@/lib/utils";

export default async function AppDashboardPage() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const dreams = await getDreamsByUser(viewer.id);
  const activeDreams = dreams.filter((dream) => dream.status === "ACTIVE");
  const recurringDreams = dreams.filter((dream) => dream.isRecurring);
  const analyzedDreams = dreams.filter((dream) => dream.analysis);

  return (
    <div className="stack-lg">
      <section className="app-panel stack-lg">
        <div className="stack-sm">
          <span className="brand-mark">
            <span className="brand-orb" />
            Dashboard
          </span>
          <h1 className="section-title">梦境总览</h1>
          <p className="muted-text">你的梦境全景，尽在眼前</p>
        </div>

        <div className="dashboard-grid">
          <div className="metric-card">
            <div className="metric-label">总梦境数</div>
            <div className="metric-value">{dreams.length}</div>
            <p className="helper-text">包含草稿、活跃和归档记录。</p>
          </div>
          <div className="metric-card">
            <div className="metric-label">已分析</div>
            <div className="metric-value">{analyzedDreams.length}</div>
            <p className="helper-text">完成 AI 解析后会进入洞察报告统计。</p>
          </div>
          <div className="metric-card">
            <div className="metric-label">重复梦境</div>
            <div className="metric-value">{recurringDreams.length}</div>
            <p className="helper-text">适合持续观察压力源与主题模式。</p>
          </div>
        </div>

        <div className="button-row">
          <Link className="button button-primary" href="/dreams/new">
            {viewer.canWrite ? "记录新梦境" : "浏览记录页"}
          </Link>
          <Link className="button button-secondary" href="/insights">
            查看洞察
          </Link>
          <Link className="button button-secondary" href="/community">
            浏览共享社区
          </Link>
        </div>
      </section>

      <section className="app-panel stack-md">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <div className="field-label">梦境库</div>
            <h2 className="panel-title">最近记录</h2>
          </div>
          <span className="status-badge">{activeDreams.length} 条处于活跃状态</span>
        </div>

        <div className="dream-list">
          {dreams.length === 0 ? (
            <div className="card">
              <div style={{ fontWeight: 800 }}>还没有梦境记录</div>
              <p className="helper-text">从一条新的梦境开始，应用会自动把它纳入 AI 分析、洞察和共享流程。</p>
            </div>
          ) : (
            dreams.map((dream) => (
              <Link className="dream-card-link" href={`/dreams/${dream.id}`} key={dream.id}>
                <div className="list-card stack-sm">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                    <div style={{ fontWeight: 800 }}>{dream.title}</div>
                    <span className="status-badge">{dream.status}</span>
                  </div>
                  <div className="helper-text">{formatDateTime(dream.dreamedAt)}</div>
                  <p className="muted-text">{truncateText(dream.contentPlain, 160)}</p>
                  <div className="badge-row">
                    {dream.emotions.map((emotion) => (
                      <span className="chip" key={`${dream.id}-${emotion}`}>
                        {emotion}
                      </span>
                    ))}
                    <span className="chip">清晰度 {dream.clarity}/5</span>
                    {dream.isRecurring ? <span className="chip">重复梦境</span> : null}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
