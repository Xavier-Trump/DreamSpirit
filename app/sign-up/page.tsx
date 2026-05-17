import { SignUpForm } from "@/components/auth/sign-up-form";
import { isDemoModeEnabled } from "@/lib/demo";

export default function SignUpPage() {
  const demoMode = isDemoModeEnabled();

  return (
    <main className="auth-shell">
      <section className="hero-panel">
        <div className="stack-lg">
          <span className="brand-mark">
            <span className="brand-orb" />
            Dream Archive
          </span>
          <div className="stack-md">
            <h1 className="display-title">从第一条梦境开始，建立长期记忆。</h1>
            <p className="muted-text" style={{ maxWidth: 560, fontSize: 18, lineHeight: 1.8 }}>
              注册后，你的梦境可以被持续编辑、分析与导出，也能在审核通过后匿名进入共享梦境池。
            </p>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <SignUpForm demoMode={demoMode} />
      </section>
    </main>
  );
}
