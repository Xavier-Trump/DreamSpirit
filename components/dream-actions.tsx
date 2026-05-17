"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type DreamActionsProps = {
  dreamId: string;
  aiConfigured?: boolean;
  shareStatus?: string | null;
  shareReview?: {
    notes?: string | null;
    riskFlags?: string[];
  } | null;
  readOnly?: boolean;
  readOnlyMessage?: string;
};

type JobResult = {
  output?: {
    approved?: boolean;
    notes?: string;
    riskFlags?: string[];
  } | null;
};

function shareStatusLabel(status?: string | null) {
  if (status === "APPROVED") {
    return "已进入共享池";
  }

  if (status === "REJECTED") {
    return "未通过";
  }

  if (status === "PENDING") {
    return "待审核";
  }

  return "未提交";
}

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
      throw new Error(result.error || "任务失败");
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
}

export function DreamActions({ dreamId, aiConfigured = false, shareStatus, shareReview, readOnly = false, readOnlyMessage }: DreamActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runAction(path: string, label: string) {
    const requiresAi = path === "analyze" || path === "story" || path === "image";
    if (requiresAi && !aiConfigured) {
      setMessage("AI 功能还没有配置 API Key。请先到设置页填写 AI API 配置；不配置也可以继续离线记录、编辑、导出和共享审核。");
      return;
    }

    if (readOnly) {
      setMessage(readOnlyMessage || "访客浏览模式暂不支持这个操作。");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          setMessage(`${label}任务已加入队列...`);
          const response = await fetch(`/api/dreams/${dreamId}/${path}`, {
            method: "POST"
          });
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || `${label}失败`);
          }

          const jobResult = (await pollJob(result.jobId)) as JobResult;
          if (path === "share") {
            const notes = jobResult.output?.notes;
            setMessage(notes || "匿名共享审核完成，内容已刷新。");
          } else {
            setMessage(`${label}完成，内容已刷新。`);
          }
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : `${label}失败`);
        }
      })();
    });
  }

  return (
    <div className="card stack-md">
      <div>
        <div className="field-label">内容动作</div>
        <div style={{ fontWeight: 800, marginTop: 6 }}>服务端排队执行</div>
      </div>

      <div className="button-row">
        <button className="button button-primary" disabled={readOnly || pending || !aiConfigured} onClick={() => runAction("analyze", "梦境解析")}>
          解析梦境
        </button>
        <button className="button button-secondary" disabled={readOnly || pending || !aiConfigured} onClick={() => runAction("story", "创意故事")}>
          生成故事
        </button>
        <button className="button button-secondary" disabled={readOnly || pending || !aiConfigured} onClick={() => runAction("image", "梦境图片")}>
          生成图片
        </button>
        <button className="button button-ghost" disabled={readOnly || pending} onClick={() => runAction("share", "匿名共享审核")}>
          {shareStatus === "APPROVED" ? "重新提交共享" : "提交匿名共享"}
        </button>
        <Link className="button button-secondary" href="/api/dreams/export">
          导出 Markdown
        </Link>
        <Link className="button button-secondary" href="/exports/print">
          打印 PDF
        </Link>
      </div>

      <div className="helper-text">
        当前共享状态：{shareStatusLabel(shareStatus)}。匿名共享会先做本地规则过滤和隐私脱敏；图片、解析和故事仍通过任务队列完成。
      </div>

      {!aiConfigured ? (
        <div className="notice">
          当前未配置 AI API Key，AI 解析、故事和图片生成暂不可用。离线记录、编辑、时间轴、导出和匿名共享审核可以继续使用。{" "}
          <Link className="link-inline" href="/settings">
            去设置
          </Link>
        </div>
      ) : null}

      {shareReview?.notes ? <div className="notice">{shareReview.notes}</div> : null}
      {shareReview?.riskFlags?.length ? <div className="helper-text">审核标记：{shareReview.riskFlags.join("、")}</div> : null}

      {readOnlyMessage ? <div className="notice">{readOnlyMessage}</div> : null}

      {message ? <div className="notice">{message}</div> : null}
    </div>
  );
}
