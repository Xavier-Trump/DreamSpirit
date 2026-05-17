import { redirect } from "next/navigation";

import { getViewer } from "@/lib/demo";
import { getInsightSummary } from "@/lib/insights";

export default async function InsightsPage() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const summary = await getInsightSummary(viewer.id);

  return (
    <div className="stack-lg">
      <section className="app-panel stack-lg">
        <div className="stack-sm">
          <span className="brand-mark">
            <span className="brand-orb" />
            Insight Report
          </span>
          <h1 className="section-title">解析你的梦境，找出反复出现的主题与情绪</h1>
          <p className="muted-text">{summary.narrative.summary}</p>
        </div>

        <div className="insights-grid">
          <div className="metric-card">
            <div className="metric-label">总记录</div>
            <div className="metric-value">{summary.totals.dreams}</div>
            <p className="helper-text">当前已纳入报告分析的梦境总数</p>
          </div>
          <div className="metric-card">
            <div className="metric-label">重复梦境</div>
            <div className="metric-value">{summary.totals.recurringDreams}</div>
            <p className="helper-text">重复梦境越多，模式识别越稳定</p>
          </div>
          <div className="metric-card">
            <div className="metric-label">现实关联</div>
            <div className="metric-value">{summary.totals.realityConnections}</div>
            <p className="helper-text">你有多少条梦境已经在现实有明显关联</p>
          </div>
        </div>
      </section>

      <section className="insights-grid">
        <div className="app-panel stack-md">
          <h2 className="panel-title">高频主题</h2>
          {summary.topThemes.length === 0 ? (
            <p className="helper-text">继续生成 AI 解析后，这里会出现主题聚类。</p>
          ) : (
            summary.topThemes.map((theme) => (
              <div className="stack-sm" key={theme.label}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{theme.label}</span>
                  <span className="helper-text">{theme.count}</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${Math.min(100, theme.count * 18)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="app-panel stack-md">
          <h2 className="panel-title">情绪分布</h2>
          {summary.emotionDistribution.map((emotion) => (
            <div className="stack-sm" key={emotion.label}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{emotion.label}</span>
                <span className="helper-text">{emotion.count}</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${Math.min(100, emotion.count * 16)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="app-panel stack-md">
          <h2 className="panel-title">常见主题对比</h2>
          {summary.benchmarkThemes.map((item) => (
            <div className="stack-sm" key={item.key}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>{item.label}</span>
                <span className="helper-text">{item.count}</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${Math.min(100, item.count * 18)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="app-panel stack-lg">
        <div className="grid-two">
          <div className="card stack-md">
            <h2 className="panel-title">压力模式</h2>
            {summary.stressPatterns.length === 0 ? (
              <p className="helper-text">尚未积累到足够的压力源分析数据。</p>
            ) : (
              summary.stressPatterns.map((item) => (
                <div className="chip" key={item.label}>
                  {item.label} · {item.count}
                </div>
              ))
            )}
          </div>
          <div className="card stack-md">
            <h2 className="panel-title">记录建议</h2>
            <p className="muted-text">{summary.narrative.recommendation}</p>
            <div className="helper-text">重复梦境：{summary.recurringClusters.recurring} 条，单次梦境：{summary.recurringClusters.oneOff} 条。</div>
          </div>
        </div>
      </section>
    </div>
  );
}
