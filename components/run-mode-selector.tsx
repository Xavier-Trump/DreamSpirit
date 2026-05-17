"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type RunMode = "local" | "network";

const storageKey = "dreamspirit.runMode";

function inferModeFromLocation() {
  if (typeof window === "undefined") {
    return "local";
  }

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "local";
  }

  return "network";
}

export function RunModeSelector() {
  const [mode, setMode] = useState<RunMode>("local");
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    setOrigin(window.location.origin);
    const savedMode = window.localStorage.getItem(storageKey) as RunMode | null;
    setMode(savedMode === "local" || savedMode === "network" ? savedMode : inferModeFromLocation());
  }, []);

  function selectMode(nextMode: RunMode) {
    setMode(nextMode);
    window.localStorage.setItem(storageKey, nextMode);
  }

  return (
    <div className="card stack-md">
      <div>
        <div className="field-label">运行模式</div>
        <div style={{ fontWeight: 800, marginTop: 6 }}>选择这次怎么使用 DreamSpirit</div>
      </div>

      <div className="button-row">
        <button className={cn("button", mode === "local" ? "button-primary" : "button-secondary")} type="button" onClick={() => selectMode("local")}>
          本机离线
        </button>
        <button className={cn("button", mode === "network" ? "button-primary" : "button-secondary")} type="button" onClick={() => selectMode("network")}>
          联网访问
        </button>
      </div>

      {mode === "local" ? (
        <div className="notice">
          本机离线模式适合自己使用：数据保存在当前电脑，本机访问 <strong>{origin}</strong>。AI 功能需要在本页配置 API Key；不配置也可以记录、编辑、导出和做本地共享审核。
        </div>
      ) : (
        <div className="notice">
          联网访问适合同一局域网或临时隧道访问：请在启动脚本里选择“LAN or tunnel”，其他设备访问这台电脑的局域网地址或隧道链接。当前访问地址：<strong>{origin}</strong>。
          别人提交的数据会写入这台电脑的数据库。
        </div>
      )}

      <div className="helper-text">选择会保存在当前浏览器里，刷新页面后仍会保留。真正的网络开放范围由启动脚本决定。</div>
    </div>
  );
}
