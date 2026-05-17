"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { EXPERIENCE_ACCOUNT_EMAIL, EXPERIENCE_ACCOUNT_PASSWORD } from "@/lib/experience-account-constants";

export const EXPERIENCE_ACCOUNT_EVENT = "dreamspirit:use-experience-account";

export function SignInForm({ callbackUrl = "/app", demoMode = false }: { callbackUrl?: string; demoMode?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [codeCooldown, setCodeCooldown] = useState(0);

  useEffect(() => {
    function fillExperienceAccount() {
      setEmail(EXPERIENCE_ACCOUNT_EMAIL);
      setPassword(EXPERIENCE_ACCOUNT_PASSWORD);
      setError(null);
    }

    window.addEventListener(EXPERIENCE_ACCOUNT_EVENT, fillExperienceAccount);
    return () => window.removeEventListener(EXPERIENCE_ACCOUNT_EVENT, fillExperienceAccount);
  }, []);

  useEffect(() => {
    if (codeCooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setCodeCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [codeCooldown]);

  function sendResetCode() {
    if (!resetEmail.trim()) {
      setResetMessage("请先输入邮箱。");
      return;
    }

    setCodeCooldown(60);
    setResetMessage("验证码已发送。当前版本先展示重置流程，邮件服务尚未启用。");
  }

  function completePasswordReset() {
    if (!resetEmail.trim() || !resetCode.trim() || !resetPassword.trim()) {
      setResetMessage("请填写邮箱、验证码和新密码。");
      return;
    }

    setResetMessage("已提交重置请求。验证码功能启用后，这里会完成密码更新。");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码不正确");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form className="auth-form stack-lg" onSubmit={handleSubmit}>
      <div className="stack-sm">
        <div className="brand-mark">
          <span className="brand-orb" />
          Welcome to use DreamSpirit
        </div>
        <h1 className="section-title">开始你的梦境宇宙</h1>
        <p className="muted-text">
          {demoMode ? "当前为访客浏览模式，登录入口保留完整账号流程。" : "使用内置体验账号或你自己的账号进入 DreamSpirit。"}
        </p>
      </div>

      {demoMode ? <div className="notice">访客浏览模式不会写入或修改数据。</div> : null}

      <div className="stack-md">
        <label className="field-group">
          <span className="field-label">邮箱</span>
          <input className="field-input" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field-group">
          <span className="field-label">密码</span>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      </div>

      {error ? <div className="notice danger-zone">{error}</div> : null}

      <div className="button-row auth-action-row">
        <button className="button button-primary" disabled={loading} type="submit">
          {loading ? "登录中..." : "进入 DreamSpirit"}
        </button>
        <Link href={demoMode ? "/app" : "/sign-up"} className="button button-secondary">
          {demoMode ? "访客浏览" : "注册账号"}
        </Link>
        <button className="button button-secondary" type="button" onClick={() => setResetOpen(true)}>
          找回密码
        </button>
      </div>

      <p className="auth-help-copy">
        遇到问题了？查看
        <a className="auth-help-link" href="https://github.com/Xavier-Trump/DreamSpirit" target="_blank" rel="noreferrer">
          帮助
        </a>
      </p>

      {resetOpen ? (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => setResetOpen(false)}>
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="auth-modal-header">
              <div>
                <div className="brand-mark">
                  <span className="brand-orb" />
                  DreamSpirit
                </div>
                <h2 className="panel-title" id="reset-password-title">
                  重置密码
                </h2>
              </div>
              <button className="auth-modal-close" type="button" aria-label="关闭" onClick={() => setResetOpen(false)}>
                ×
              </button>
            </div>

            <div className="stack-md">
              <label className="field-group">
                <span className="field-label">邮箱</span>
                <div className="auth-code-row">
                  <input
                    className="field-input"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="输入绑定邮箱"
                  />
                  <button className="button button-primary auth-code-button" type="button" disabled={codeCooldown > 0} onClick={sendResetCode}>
                    {codeCooldown > 0 ? `${codeCooldown}s` : "发送验证码"}
                  </button>
                </div>
              </label>
              <label className="field-group">
                <span className="field-label">验证码</span>
                <input className="field-input" value={resetCode} onChange={(event) => setResetCode(event.target.value)} placeholder="输入验证码" />
              </label>
              <label className="field-group">
                <span className="field-label">新密码</span>
                <input
                  className="field-input"
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder="设置新密码"
                />
              </label>
              {resetMessage ? <div className="notice">{resetMessage}</div> : null}
              <button className="button button-primary" type="button" onClick={completePasswordReset}>
                重置密码
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
