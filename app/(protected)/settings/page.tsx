import { redirect } from "next/navigation";

import { AiConfigForm } from "@/components/ai-config-form";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { DreamPreferencesForm } from "@/components/dream-preferences-form";
import { RunModeSelector } from "@/components/run-mode-selector";
import { getRuntimeAiConfig, toSafeAiConfigResponse } from "@/lib/ai-config";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { getUserDreamPreferences } from "@/lib/dream-preferences";
import { getDreamsByUser } from "@/lib/dreams";
import { EXPERIENCE_ACCOUNT_EMAIL } from "@/lib/experience-account-constants";

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const [dreams, aiConfig, dreamPreferences] = await Promise.all([
    getDreamsByUser(viewer.id),
    getRuntimeAiConfig(viewer.id),
    getUserDreamPreferences(viewer.id)
  ]);
  const readOnlyMessage = !viewer.canWrite ? getReadOnlyMessage("保存 AI API 配置") : undefined;
  const preferencesReadOnlyMessage = !viewer.canWrite ? getReadOnlyMessage("保存梦境标签和主题规则") : undefined;
  const displayViewerName = viewer.name === "DreamSpirit 梦灵体验账号" ? "DreamSpirit 体验账号" : viewer.name;

  return (
    <div className="stack-lg">
      <section className="app-panel stack-lg">
        <div className="stack-sm">
          <span className="brand-mark">
            <span className="brand-orb" />
            Settings
          </span>
          <h1 className="section-title">你的专属设置中心</h1>
          <p className="muted-text">管理账号、数据导出与 AI 解析偏好</p>
        </div>
      </section>

      <section className="settings-grid settings-grid-balanced">
        <div className="app-panel stack-md settings-column">
          <h2 className="panel-title">账号摘要</h2>
          <div className="metric-card">
            <div className="metric-label">当前账号</div>
            <div className="metric-value" style={{ fontSize: 24 }}>
              {viewer.isGuest ? "访客浏览" : displayViewerName || viewer.email}
            </div>
            <p className="helper-text">{viewer.isGuest ? "当前页面使用内置体验数据。" : viewer.email}</p>
          </div>
          <div className="card">
            <div className="helper-text">当前数据库中的梦境总数：{dreams.length}。注销账号会同步清除私有梦境与共享记录。</div>
          </div>
          <RunModeSelector />

          <h2 className="panel-title">导出与保留</h2>
          <div className="card stack-md">
            <p className="muted-text">当前提供 Markdown 备份，以及适合浏览器保存为 PDF 的打印报告。</p>
            <div className="button-row">
              <a className="button button-primary" href="/api/dreams/export">
                下载 Markdown
              </a>
              <a className="button button-secondary" href="/exports/print">
                打印 / 保存 PDF
              </a>
            </div>
          </div>
          <div className="card danger-zone stack-md">
            <div style={{ fontWeight: 800 }}>危险操作</div>
            <p className="helper-text">账号注销是不可逆的，执行前请确认已经完成必要导出。</p>
            <DeleteAccountButton
              accountEmail={viewer.email}
              disabled={!viewer.canWrite && viewer.email !== EXPERIENCE_ACCOUNT_EMAIL}
              disabledMessage={!viewer.canWrite && viewer.email !== EXPERIENCE_ACCOUNT_EMAIL ? getReadOnlyMessage("注销账号") : undefined}
            />
          </div>
        </div>

        <div className="app-panel stack-md settings-column">
          <AiConfigForm initialConfig={toSafeAiConfigResponse(aiConfig)} readOnly={!viewer.canWrite} readOnlyMessage={readOnlyMessage} />
          <DreamPreferencesForm
            initialEmotions={dreamPreferences.emotions}
            initialThemeRules={dreamPreferences.themeRules}
            readOnly={!viewer.canWrite}
            readOnlyMessage={preferencesReadOnlyMessage}
          />
        </div>
      </section>
    </div>
  );
}
