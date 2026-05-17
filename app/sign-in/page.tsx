import { BookOpenText, BrainCircuit, Feather, Image, LineChart, UsersRound } from "lucide-react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { UseDemoAccountButton } from "@/components/auth/use-demo-account-button";
import { isDemoModeEnabled } from "@/lib/demo";
import { EXPERIENCE_ACCOUNT_EMAIL, EXPERIENCE_ACCOUNT_PASSWORD } from "@/lib/experience-account-constants";

const featureCards = [
  { label: "梦境记录", tone: "warm", icon: BookOpenText },
  { label: "AI解析", tone: "aqua", icon: BrainCircuit },
  { label: "创意故事", tone: "gold", icon: Feather },
  { label: "图像生成", tone: "rose", icon: Image },
  { label: "洞察报告", tone: "mint", icon: LineChart },
  { label: "匿名共享", tone: "violet", icon: UsersRound }
];

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/app";
  const demoMode = isDemoModeEnabled();

  return (
    <main className="auth-shell">
      <section className="hero-panel">
        <div className="stack-lg">
          <span className="brand-mark">
            <span className="brand-orb" />
            DreamSpirit 梦灵
          </span>
          <div className="stack-md">
            <div>
              <h1 className="display-title auth-hero-title">帮你记录潜意识的低语，解开心灵密码</h1>
              <h2 className="display-title auth-hero-title">用文字和声音，来捕捉昨夜的心象风景</h2>
            </div>
            <div className="auth-feature-row" aria-label="DreamSpirit 功能">
              {featureCards.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div className={`auth-feature-card auth-feature-${feature.tone}`} key={feature.label}>
                    <span>{feature.label}</span>
                    <Icon className="auth-feature-icon" size={88} strokeWidth={1.35} aria-hidden="true" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="card auth-account-card">
          <div className="field-label">登录提示</div>
          <p className="muted-text auth-account-copy">
            <span>当前已内置体验账号：</span>
            <span>{EXPERIENCE_ACCOUNT_EMAIL}</span>
            <span>{EXPERIENCE_ACCOUNT_PASSWORD}</span>
            <span>{demoMode ? "也可以直接进入访客浏览模式" : "登录后可直接查看记录、洞察报告与共享梦境"}</span>
          </p>
          <UseDemoAccountButton />
        </div>
      </section>

      <section className="auth-panel">
        <SignInForm callbackUrl={callbackUrl} demoMode={demoMode} />
      </section>
    </main>
  );
}
