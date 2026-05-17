"use client";

import { JSONContent } from "@tiptap/core";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { BrowserSpeechDictation } from "@/components/browser-speech-dictation";
import { RichTextEditor } from "@/components/rich-text-editor";
import { cn } from "@/lib/utils";

type DreamFormPayload = {
  id?: string;
  title: string;
  contentRich: JSONContent;
  contentPlain: string;
  dreamedAt: string;
  emotions: string[];
  clarity: number;
  isRecurring: boolean;
  realityConnection?: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";
};

function toLocalInput(date: string) {
  const value = new Date(date);
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultDoc(): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph"
      }
    ]
  };
}

export function DreamForm({
  mode,
  initialDream,
  emotionOptions,
  readOnly = false,
  readOnlyMessage
}: {
  mode: "create" | "edit";
  initialDream?: DreamFormPayload;
  emotionOptions: string[];
  readOnly?: boolean;
  readOnlyMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialDream?.title || "");
  const [contentRich, setContentRich] = useState<JSONContent>(initialDream?.contentRich || defaultDoc());
  const [contentPlain, setContentPlain] = useState(initialDream?.contentPlain || "");
  const [dreamedAt, setDreamedAt] = useState(initialDream ? toLocalInput(initialDream.dreamedAt) : toLocalInput(new Date().toISOString()));
  const [emotions, setEmotions] = useState<string[]>(initialDream?.emotions || []);
  const [clarity, setClarity] = useState(initialDream?.clarity || 3);
  const [isRecurring, setIsRecurring] = useState(initialDream?.isRecurring || false);
  const [realityConnection, setRealityConnection] = useState(initialDream?.realityConnection || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [customEmotion, setCustomEmotion] = useState("");
  const [dirty, setDirty] = useState(false);
  const [dictationInsert, setDictationInsert] = useState<{ id: number; text: string } | null>(null);

  const endpoint = initialDream?.id ? `/api/dreams/${initialDream.id}` : "/api/dreams";
  const method = initialDream?.id ? "PATCH" : "POST";
  const initialized = useRef(false);
  const dictationInsertId = useRef(0);
  const visibleEmotionOptions = useMemo(
    () => [...new Set([...emotionOptions, ...emotions].map((item) => item.trim()).filter(Boolean))],
    [emotionOptions, emotions]
  );

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setDirty(true);
    setStatus("idle");
  }, [title, contentPlain, dreamedAt, clarity, isRecurring, realityConnection, emotions]);

  useEffect(() => {
    if (!initialDream?.id || !dirty) {
      return;
    }

    const timer = setTimeout(async () => {
      await saveDream("DRAFT", true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [dirty, title, contentPlain, contentRich, dreamedAt, emotions, clarity, isRecurring, realityConnection, initialDream?.id]);

  function toggleEmotion(emotion: string) {
    setEmotions((current) => (current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion]));
  }

  function addCustomEmotion() {
    const nextEmotion = customEmotion.trim();
    if (!nextEmotion) {
      return;
    }

    setEmotions((current) => (current.includes(nextEmotion) ? current : [...current, nextEmotion]));
    setCustomEmotion("");
  }

  function insertDictationText(text: string) {
    dictationInsertId.current += 1;
    setDictationInsert({
      id: dictationInsertId.current,
      text
    });
  }

  async function saveDream(nextStatus: "DRAFT" | "ACTIVE", silent = false) {
    if (readOnly) {
      setStatus("error");
      setMessage(readOnlyMessage || "访客浏览模式暂不支持保存。");
      return;
    }

    if (!silent && !title.trim()) {
      setStatus("error");
      setMessage("请先填写梦境标题。");
      return;
    }

    if (!silent && !contentPlain.trim()) {
      setStatus("error");
      setMessage("请先填写梦境内容。");
      return;
    }

    const payload = {
      title: title.trim() || "未命名梦境",
      contentRich,
      contentPlain: contentPlain.trim() || "空白草稿",
      dreamedAt: new Date(dreamedAt).toISOString(),
      emotions,
      clarity,
      isRecurring,
      realityConnection: realityConnection || null,
      status: nextStatus
    };

    try {
      setStatus("saving");
      if (!silent) {
        setMessage(nextStatus === "DRAFT" ? "正在保存草稿..." : "正在保存梦境...");
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "保存失败");
      }

      setDirty(false);
      setStatus("saved");
      setMessage(nextStatus === "DRAFT" ? "草稿已自动保存。" : "梦境已保存。");

      if (!initialDream?.id) {
        router.push(`/dreams/${result.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  }

  return (
    <div className="app-panel stack-lg">
      <div className="stack-sm">
        <div className="brand-mark">
          <span className="brand-orb" />
          {mode === "create" ? "New Dream" : "Dream Detail"}
        </div>
        <h1 className="section-title">{mode === "create" ? "记录新的梦境" : "编辑并深化这条梦境"}</h1>
        <p className="muted-text">
          {mode === "create"
            ? "支持富文本编辑与云端同步，你的梦境会被安全存储并自动解析"
            : "当你修改内容后，系统会在 15 秒后自动保存草稿。"}
        </p>
      </div>

      {readOnlyMessage ? <div className="notice">{readOnlyMessage}</div> : null}

      <div className="grid-two">
        <label className="field-group">
          <span className="field-label">梦境标题</span>
          <input className="field-input" disabled={readOnly} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label className="field-group">
          <span className="field-label">梦境发生时间</span>
          <input
            className="field-input"
            disabled={readOnly}
            type="datetime-local"
            value={dreamedAt}
            onChange={(event) => setDreamedAt(event.target.value)}
          />
        </label>
      </div>

      <div className="field-group">
        <span className="field-label">梦境内容</span>
        <BrowserSpeechDictation disabled={readOnly} onTranscript={insertDictationText} />
        <RichTextEditor
          editable={!readOnly}
          insertTextRequest={dictationInsert}
          value={contentRich}
          onChange={(payload) => {
            setContentRich(payload.json);
            setContentPlain(payload.text);
          }}
        />
      </div>

      <div className="field-group">
        <span className="field-label">情绪标签</span>
        <div className="emotion-grid">
          {visibleEmotionOptions.map((emotion) => (
            <button
              key={emotion}
              className={cn("emotion-chip", emotions.includes(emotion) && "selected")}
              disabled={readOnly}
              onClick={() => toggleEmotion(emotion)}
              type="button"
            >
              {emotion}
            </button>
          ))}
        </div>
        <div className="button-row">
          <input
            className="field-input"
            disabled={readOnly}
            onChange={(event) => setCustomEmotion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomEmotion();
              }
            }}
            placeholder="输入临时情绪标签"
            style={{ flex: "1 1 220px" }}
            value={customEmotion}
          />
          <button className="button button-secondary" disabled={readOnly || !customEmotion.trim()} onClick={addCustomEmotion} type="button">
            添加标签
          </button>
        </div>
      </div>

      <div className="grid-two">
        <div className="field-group">
          <span className="field-label">清晰度</span>
          <div className="button-row">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                className={cn("button", clarity === value ? "button-primary" : "button-secondary")}
                disabled={readOnly}
                onClick={() => setClarity(value)}
                type="button"
              >
                {value} 星
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <span className="field-label">重复梦境</span>
          <label className="chip" style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
            <input checked={isRecurring} disabled={readOnly} onChange={(event) => setIsRecurring(event.target.checked)} type="checkbox" />
            标记为重复出现
          </label>
        </div>
      </div>

      <label className="field-group">
        <span className="field-label">现实关联</span>
        <textarea
          className="field-textarea"
          disabled={readOnly}
          value={realityConnection}
          onChange={(event) => setRealityConnection(event.target.value)}
          placeholder="比如：梦到的压力、现实中的预感、后来是否成真。"
        />
      </label>

      <div className="button-row">
        <button
          className="button button-secondary"
          disabled={readOnly || pending || status === "saving"}
          type="button"
          onClick={() =>
            startTransition(() => {
              void saveDream("DRAFT");
            })
          }
        >
          保存草稿
        </button>
        <button
          className="button button-primary"
          disabled={readOnly || pending || status === "saving"}
          type="button"
          onClick={() =>
            startTransition(() => {
              void saveDream("ACTIVE");
            })
          }
        >
          {mode === "create" ? "创建梦境" : "保存变更"}
        </button>
        {mode === "edit" ? (
          <Link className="button button-ghost" href="/app">
            返回总览
          </Link>
        ) : null}
      </div>

      {message ? (
        <div className={cn("notice", status === "error" && "danger-zone")}>
          {message}
        </div>
      ) : null}
    </div>
  );
}
