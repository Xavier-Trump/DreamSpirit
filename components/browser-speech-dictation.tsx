"use client";

import { useEffect, useRef, useState } from "react";
import { Languages, Mic, Square } from "lucide-react";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type BrowserSpeechDictationProps = {
  disabled?: boolean;
  onTranscript: (text: string) => void;
};

const LANGUAGES = [
  { label: "中文普通话", value: "zh-CN" },
  { label: "粤语", value: "zh-HK" },
  { label: "English", value: "en-US" }
];

function getRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

function formatError(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "麦克风权限被拒绝，请在浏览器地址栏允许麦克风后再试。";
  }

  if (error === "no-speech") {
    return "没有识别到语音，可以靠近麦克风再试一次。";
  }

  if (error === "network") {
    return "浏览器语音识别服务暂时无法连接，请稍后重试。";
  }

  return "语音听写中断了，可以重新开始。";
}

export function BrowserSpeechDictation({ disabled = false, onTranscript }: BrowserSpeechDictationProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState("zh-CN");
  const [interimText, setInterimText] = useState("");
  const [message, setMessage] = useState("使用浏览器内置语音识别，边说边把转写内容插入梦境正文。");

  useEffect(() => {
    setSupported(Boolean(getRecognitionConstructor()));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    if (disabled) {
      setMessage("当前为只读状态，不能插入语音听写内容。");
      return;
    }

    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setSupported(false);
      setMessage("当前浏览器不支持内置语音识别。本地使用建议使用最新版 Chrome 或 Edge。");
      return;
    }

    try {
      recognitionRef.current?.abort();
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setListening(true);
        setInterimText("");
        setMessage("正在听写，说完一小段后会自动插入正文。");
      };

      recognition.onresult = (event) => {
        let finalText = "";
        let nextInterimText = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript?.trim();

          if (!transcript) {
            continue;
          }

          if (result.isFinal) {
            finalText += `${transcript} `;
          } else {
            nextInterimText += `${transcript} `;
          }
        }

        if (finalText.trim()) {
          onTranscript(finalText.trim());
          setMessage("已把刚刚识别到的内容插入正文。可以继续说，或点击停止。");
        }

        setInterimText(nextInterimText.trim());
      };

      recognition.onerror = (event) => {
        setMessage(formatError(event.error));
        setInterimText("");
      };

      recognition.onend = () => {
        setListening(false);
        setInterimText("");
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      setMessage("语音听写启动失败，请确认浏览器允许麦克风权限。");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setInterimText("");
    setMessage("语音听写已停止。");
  }

  return (
    <div className="dictation-panel">
      <div className="dictation-header">
        <div>
          <span className="field-label">语音转写</span>
          <p className="helper-text">{message}</p>
        </div>
        <div className="dictation-controls">
          <label className="dictation-language">
            <Languages size={16} aria-hidden="true" />
            <select disabled={disabled || listening} value={language} onChange={(event) => setLanguage(event.target.value)}>
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {listening ? (
            <button className="button button-primary" disabled={disabled} type="button" onClick={stopListening}>
              <Square size={16} aria-hidden="true" />
              停止
            </button>
          ) : (
            <button className="button button-secondary" disabled={disabled || supported === false} type="button" onClick={startListening}>
              <Mic size={16} aria-hidden="true" />
              开始听写
            </button>
          )}
        </div>
      </div>
      {interimText ? <div className="dictation-interim">{interimText}</div> : null}
      {supported === false ? <div className="helper-text">Firefox/Safari 可能无法使用此功能；本地使用建议使用 Chrome 或 Edge。</div> : null}
    </div>
  );
}
