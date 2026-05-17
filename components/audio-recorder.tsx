"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AudioRecorderProps = {
  dreamId: string;
  readOnly?: boolean;
  readOnlyMessage?: string;
};

async function pollJob(jobId: string) {
  while (true) {
    const response = await fetch(`/api/jobs/${jobId}`, {
      cache: "no-store"
    });
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

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("读取录音失败"));
        return;
      }
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("读取录音失败"));
    reader.readAsDataURL(blob);
  });
}

export function AudioRecorder({ dreamId, readOnly = false, readOnlyMessage }: AudioRecorderProps) {
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("先保存梦境，再使用录音转写补充内容。");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  async function handleStart() {
    if (readOnly) {
      setMessage(readOnlyMessage || "访客浏览模式暂不支持录音上传。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setLoading(true);
        setMessage("录音已上传，正在排队转写...");
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          const audioBase64 = await blobToBase64(blob);
          const response = await fetch(`/api/dreams/${dreamId}/transcribe`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              audioBase64,
              mimeType: blob.type || "audio/webm"
            })
          });
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "转写任务创建失败");
          }

          await pollJob(result.jobId);
          setMessage("服务端录音转写尚未启用，请使用实时语音听写补充正文。");
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "转写失败");
        } finally {
          setLoading(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setMessage("正在录音，点击“停止录音并转写”结束。");
    } catch {
      setMessage("当前设备或浏览器不支持录音，请改用文字输入。");
    }
  }

  function handleStop() {
    mediaRecorder?.stop();
    setRecording(false);
  }

  return (
    <div className="card stack-md">
      <div>
        <div className="field-label">语音输入</div>
        <div style={{ fontWeight: 800, marginTop: 6 }}>录音上传 + 服务端转写</div>
      </div>
      <p className="helper-text">{message}</p>
      {readOnlyMessage ? <div className="notice">{readOnlyMessage}</div> : null}
      <div className="button-row">
        {!recording ? (
          <button className="button button-secondary" disabled={readOnly || loading} type="button" onClick={handleStart}>
            开始录音
          </button>
        ) : (
          <button className="button button-primary" disabled={readOnly || loading} type="button" onClick={handleStop}>
            停止录音并转写
          </button>
        )}
      </div>
    </div>
  );
}
