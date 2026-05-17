"use client";

import { useState, useTransition } from "react";

type SafeAiConfig = {
  provider: string;
  hasApiKey: boolean;
  maskedApiKey: string;
  chatModel: string;
  imageModel: string;
  chatEndpoint: string;
  imageEndpoint: string;
};

type AiConfigFormProps = {
  initialConfig: SafeAiConfig;
  readOnly?: boolean;
  readOnlyMessage?: string;
};

export function AiConfigForm({ initialConfig, readOnly = false, readOnlyMessage }: AiConfigFormProps) {
  const [provider, setProvider] = useState(initialConfig.provider);
  const [apiKey, setApiKey] = useState("");
  const [maskedApiKey, setMaskedApiKey] = useState(initialConfig.maskedApiKey);
  const [hasApiKey, setHasApiKey] = useState(initialConfig.hasApiKey);
  const [chatModel, setChatModel] = useState(initialConfig.chatModel);
  const [imageModel, setImageModel] = useState(initialConfig.imageModel);
  const [chatEndpoint, setChatEndpoint] = useState(initialConfig.chatEndpoint);
  const [imageEndpoint, setImageEndpoint] = useState(initialConfig.imageEndpoint);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (readOnly) {
      setError(readOnlyMessage || "访客浏览模式暂不支持保存 AI API 配置。");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/settings/ai-config", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              provider,
              apiKey,
              chatModel,
              imageModel,
              chatEndpoint,
              imageEndpoint
            })
          });
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "保存 AI API 配置失败");
          }

          setApiKey("");
          setMaskedApiKey(result.maskedApiKey || "");
          setHasApiKey(Boolean(result.hasApiKey));
          setMessage("AI API 配置已保存。之后触发解析、故事或图片任务时会优先使用这里的配置。");
        } catch (err) {
          setError(err instanceof Error ? err.message : "保存 AI API 配置失败");
        }
      })();
    });
  }

  return (
    <form className="card stack-md" onSubmit={handleSubmit}>
      <div>
        <div className="field-label">AI API 配置</div>
        <div style={{ fontWeight: 800, marginTop: 6 }}>页面保存，环境变量兜底</div>
      </div>

      <div className="grid-two">
        <label className="field-group">
          <span className="field-label">供应商</span>
          <input className="field-input" disabled={readOnly || pending} value={provider} onChange={(event) => setProvider(event.target.value)} />
        </label>

        <label className="field-group">
          <span className="field-label">API Key</span>
          <input
            className="field-input"
            disabled={readOnly || pending}
            placeholder={hasApiKey ? `已保存：${maskedApiKey}，留空保持不变` : "粘贴你的 API Key"}
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>
      </div>

      <div className="grid-two">
        <label className="field-group">
          <span className="field-label">聊天 / 解析模型</span>
          <input className="field-input" disabled={readOnly || pending} value={chatModel} onChange={(event) => setChatModel(event.target.value)} />
        </label>

        <label className="field-group">
          <span className="field-label">图片模型</span>
          <input className="field-input" disabled={readOnly || pending} value={imageModel} onChange={(event) => setImageModel(event.target.value)} />
        </label>
      </div>

      <label className="field-group">
        <span className="field-label">聊天 Endpoint</span>
        <input className="field-input" disabled={readOnly || pending} value={chatEndpoint} onChange={(event) => setChatEndpoint(event.target.value)} />
      </label>

      <label className="field-group">
        <span className="field-label">图片 Endpoint</span>
        <input className="field-input" disabled={readOnly || pending} value={imageEndpoint} onChange={(event) => setImageEndpoint(event.target.value)} />
      </label>

      <div className="helper-text">
        API Key 不会在页面明文回显；如果这里没有配置，系统会继续使用 `.env.local` 里的默认值。
      </div>

      <div className="button-row">
        <button className="button button-primary" disabled={readOnly || pending} type="submit">
          {pending ? "保存中..." : "保存 AI 配置"}
        </button>
      </div>

      {readOnlyMessage ? <div className="notice">{readOnlyMessage}</div> : null}
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice danger-zone">{error}</div> : null}
    </form>
  );
}
