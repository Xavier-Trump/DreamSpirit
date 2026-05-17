"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignUpForm({ demoMode = false }: { demoMode?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (demoMode) {
      setMessage("访客浏览模式暂不开放注册，请切换到本地完整运行模式后再创建账号。");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const result = await response.json();

    if (!response.ok) {
      setLoading(false);
      setMessage(result.error || "注册失败，请稍后重试");
      return;
    }

    await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    router.push("/app");
    router.refresh();
  }

  return (
    <form className="auth-form stack-lg" onSubmit={handleSubmit}>
      <div className="stack-sm">
        <div className="brand-mark">
          <span className="brand-orb" />
          New Dreamer
        </div>
        <h1 className="section-title">创建你的正式账号</h1>
        <p className="muted-text">
          {demoMode ? "访客浏览模式暂不开放注册，这里保留账号创建流程入口。" : "从第一条梦境开始，持续沉淀你的潜意识档案。"}
        </p>
      </div>

      {demoMode ? <div className="notice">当前处于访客浏览模式，注册能力已关闭。</div> : null}

      <div className="stack-md">
        <label className="field-group">
          <span className="field-label">昵称</span>
          <input className="field-input" disabled={demoMode} value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field-group">
          <span className="field-label">邮箱</span>
          <input className="field-input" disabled={demoMode} value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="field-group">
          <span className="field-label">密码</span>
          <input
            className="field-input"
            disabled={demoMode}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
      </div>

      {message ? <div className="notice danger-zone">{message}</div> : null}

      <div className="button-row">
        <button className="button button-primary" disabled={loading} type="submit">
          {loading ? "创建中..." : demoMode ? "访客浏览模式已关闭注册" : "创建并登录"}
        </button>
        <Link href="/sign-in" className="button button-secondary">
          返回登录
        </Link>
      </div>
    </form>
  );
}
