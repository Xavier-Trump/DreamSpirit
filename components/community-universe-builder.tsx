"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SharedDreamItem = {
  id: string;
  title: string;
  excerpt: string;
  emotions: string[];
  themes: string[];
};

async function pollJob(jobId: string) {
  while (true) {
    const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "任务查询失败");
    }

    if (result.status === "succeeded") {
      return result;
    }

    if (result.status === "failed") {
      throw new Error(result.error || "宇宙故事生成失败");
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
}

export function CommunityUniverseBuilder({
  dreams,
  readOnly = false,
  readOnlyMessage
}: {
  dreams: SharedDreamItem[];
  readOnly?: boolean;
  readOnlyMessage?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 5) {
        return current;
      }
      return [...current, id];
    });
  }

  return (
    <div className="card stack-md">
      <div>
        <div className="field-label">共享梦境宇宙</div>
        <div style={{ fontWeight: 800, marginTop: 6 }}>从公开池中挑选 3-5 条匿名梦境</div>
      </div>

      <div className="helper-text">当前选择 {selected.length} 条。只有审核通过的公开梦境才会进入宇宙故事生成。</div>

      <div className="dream-list">
        {dreams.map((dream) => {
          const active = selected.includes(dream.id);
          return (
            <button
              key={dream.id}
              className="community-item"
              disabled={readOnly}
              onClick={() => toggle(dream.id)}
              style={{
                textAlign: "left",
                borderColor: active ? "rgba(255, 140, 66, 0.4)" : undefined,
                background: active ? "rgba(255, 140, 66, 0.08)" : undefined
              }}
              type="button"
            >
              <div style={{ fontWeight: 800 }}>{dream.title}</div>
              <p className="helper-text">{dream.excerpt}</p>
              <div className="badge-row">
                {dream.emotions.map((emotion) => (
                  <span key={`${dream.id}-${emotion}`} className="chip">
                    {emotion}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="button-row">
        <button
          className="button button-primary"
          disabled={readOnly || pending || selected.length < 3 || selected.length > 5}
          type="button"
          onClick={() =>
            startTransition(() => {
              void (async () => {
                try {
                  if (readOnly) {
                    setMessage(readOnlyMessage || "访客浏览模式暂不支持生成公共宇宙。");
                    return;
                  }

                  setMessage("梦境宇宙任务已排队...");
                  const response = await fetch("/api/community/universe", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      sharedDreamIds: selected
                    })
                  });
                  const result = await response.json();

                  if (!response.ok) {
                    throw new Error(result.error || "生成失败");
                  }

                  await pollJob(result.jobId);
                  setMessage("梦境宇宙故事生成完成，页面已刷新。");
                  router.refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "生成失败");
                }
              })();
            })
          }
        >
          生成共享宇宙
        </button>
      </div>

      {readOnlyMessage ? <div className="notice">{readOnlyMessage}</div> : null}

      {message ? <div className="notice">{message}</div> : null}
    </div>
  );
}
