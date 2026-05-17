"use client";

import { useState, useTransition } from "react";

type ThemeRuleFormItem = {
  key?: string;
  label: string;
  keywordsText: string;
  enabled: boolean;
};

type DreamPreferencesFormProps = {
  initialEmotions: string[];
  initialThemeRules: Array<{
    key: string;
    label: string;
    keywords: string[];
    enabled: boolean;
  }>;
  readOnly?: boolean;
  readOnlyMessage?: string;
};

function toThemeRuleFormItem(rule: DreamPreferencesFormProps["initialThemeRules"][number]): ThemeRuleFormItem {
  return {
    key: rule.key,
    label: rule.label,
    keywordsText: rule.keywords.join("、"),
    enabled: rule.enabled
  };
}

function uniqueTrimmed(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function splitKeywords(value: string) {
  return uniqueTrimmed(value.split(/[、,\n]/));
}

export function DreamPreferencesForm({
  initialEmotions,
  initialThemeRules,
  readOnly = false,
  readOnlyMessage
}: DreamPreferencesFormProps) {
  const [emotions, setEmotions] = useState(() => uniqueTrimmed(initialEmotions));
  const [newEmotion, setNewEmotion] = useState("");
  const [addingEmotion, setAddingEmotion] = useState(false);
  const [themeRules, setThemeRules] = useState<ThemeRuleFormItem[]>(initialThemeRules.map(toThemeRuleFormItem));
  const [addingRule, setAddingRule] = useState(false);
  const [draftRule, setDraftRule] = useState<ThemeRuleFormItem>({ label: "", keywordsText: "", enabled: true });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateRule(index: number, patch: Partial<ThemeRuleFormItem>) {
    setThemeRules((current) => current.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule)));
  }

  function addEmotion() {
    const label = newEmotion.trim();
    if (!label) {
      setAddingEmotion(true);
      return;
    }

    setEmotions((current) => uniqueTrimmed([...current, label]));
    setNewEmotion("");
    setAddingEmotion(false);
  }

  function removeEmotion(label: string) {
    if (readOnly || pending || emotions.length <= 1) {
      return;
    }

    setEmotions((current) => current.filter((emotion) => emotion !== label));
  }

  function addRule() {
    setAddingRule(true);
    setDraftRule({ label: "", keywordsText: "", enabled: true });
  }

  function updateDraftRule(patch: Partial<ThemeRuleFormItem>) {
    setDraftRule((current) => ({ ...current, ...patch }));
  }

  function saveDraftRule() {
    const label = draftRule.label.trim();
    const keywordsText = draftRule.keywordsText.trim();

    if (!label || splitKeywords(keywordsText).length === 0) {
      setError("请填写主题名称和至少一个关键词。");
      return;
    }

    setThemeRules((current) => [...current, { ...draftRule, label, keywordsText }]);
    setDraftRule({ label: "", keywordsText: "", enabled: true });
    setAddingRule(false);
    setError(null);
  }

  function removeRule(index: number) {
    setThemeRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (readOnly) {
      setError(readOnlyMessage || "访客浏览模式暂不支持保存梦境标签和主题规则。");
      return;
    }

    const nextEmotions = uniqueTrimmed(emotions);
    const nextThemeRules = themeRules
      .map((rule) => ({
        key: rule.key,
        label: rule.label.trim(),
        keywords: splitKeywords(rule.keywordsText),
        enabled: rule.enabled
      }))
      .filter((rule) => rule.label && rule.keywords.length > 0);

    if (nextEmotions.length === 0) {
      setError("请至少保留一个情绪标签。");
      return;
    }

    if (nextThemeRules.length === 0) {
      setError("请至少保留一条主题规则。");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/settings/dream-preferences", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              emotions: nextEmotions,
              themeRules: nextThemeRules
            })
          });
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "保存梦境标签和主题规则失败。");
          }

          setEmotions(result.emotions);
          setThemeRules(result.themeRules.map((rule: { key: string; label: string; keywords: string[]; enabled: boolean }) => toThemeRuleFormItem(rule)));
          setMessage("梦境标签和主题规则已保存。新建梦境和洞察统计会使用最新配置。");
        } catch (err) {
          setError(err instanceof Error ? err.message : "保存梦境标签和主题规则失败。");
        }
      })();
    });
  }

  return (
    <form className="card stack-md dream-preferences-card" onSubmit={handleSubmit}>
      <div>
        <div className="field-label">梦境标签与主题规则</div>
        <div style={{ fontWeight: 800, marginTop: 6 }}>本地数据库保存，按用户独立生效</div>
      </div>

      <section className="field-group">
        <div className="dream-section-header">
          <span className="field-label">情绪标签</span>
          <button className="dream-add-button" disabled={readOnly || pending} onClick={() => setAddingEmotion(true)} type="button">
            + 添加
          </button>
        </div>

        {addingEmotion ? (
          <div className="dream-add-row">
            <input
              autoFocus
              className="field-input"
              disabled={readOnly || pending}
              onChange={(event) => setNewEmotion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addEmotion();
                }
                if (event.key === "Escape") {
                  setAddingEmotion(false);
                  setNewEmotion("");
                }
              }}
              placeholder="输入新的情绪标签"
              value={newEmotion}
            />
            <button className="button button-primary" disabled={readOnly || pending} onClick={addEmotion} type="button">
              添加
            </button>
          </div>
        ) : null}

        <div className="dream-emotion-list" aria-label="情绪标签列表">
          {emotions.map((emotion) => (
            <span className="dream-emotion-tag" key={emotion}>
              {emotion}
              <button
                aria-label={`删除${emotion}`}
                className="dream-emotion-remove"
                disabled={readOnly || pending || emotions.length <= 1}
                onClick={() => removeEmotion(emotion)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="stack-md">
        <div className="dream-section-header">
          <span className="field-label">主题规则</span>
          <button className="dream-add-button" disabled={readOnly || pending || addingRule} onClick={addRule} type="button">
            + 新增规则
          </button>
        </div>

        {addingRule ? (
          <div className="dream-theme-rule-card dream-theme-rule-draft stack-md">
            <div className="grid-two">
              <label className="field-group">
                <span className="field-label">主题名称</span>
                <input
                  autoFocus
                  className="field-input"
                  disabled={readOnly || pending}
                  onChange={(event) => updateDraftRule({ label: event.target.value })}
                  placeholder="例如：校园"
                  value={draftRule.label}
                />
              </label>

              <label className="field-group">
                <span className="field-label">关键词</span>
                <input
                  className="field-input"
                  disabled={readOnly || pending}
                  onChange={(event) => updateDraftRule({ keywordsText: event.target.value })}
                  placeholder="学校、老师、教室"
                  value={draftRule.keywordsText}
                />
              </label>
            </div>

            <div className="button-row">
              <label className="dream-rule-toggle">
                <input checked={draftRule.enabled} disabled={readOnly || pending} onChange={(event) => updateDraftRule({ enabled: event.target.checked })} type="checkbox" />
                启用
              </label>
              <button className="button button-primary" disabled={readOnly || pending} onClick={saveDraftRule} type="button">
                保存到列表
              </button>
              <button
                className="button button-secondary"
                disabled={readOnly || pending}
                onClick={() => {
                  setAddingRule(false);
                  setDraftRule({ label: "", keywordsText: "", enabled: true });
                }}
                type="button"
              >
                取消
              </button>
            </div>
          </div>
        ) : null}

        <div className="dream-theme-rule-list">
          {themeRules.map((rule, index) => (
            <div className="dream-theme-rule-card stack-md" key={rule.key || `new-${index}`}>
              <div className="grid-two">
                <label className="field-group">
                  <span className="field-label">主题名称</span>
                  <input
                    className="field-input"
                    disabled={readOnly || pending}
                    onChange={(event) => updateRule(index, { label: event.target.value })}
                    placeholder="例如：校园"
                    value={rule.label}
                  />
                </label>

                <label className="field-group">
                  <span className="field-label">关键词</span>
                  <input
                    className="field-input"
                    disabled={readOnly || pending}
                    onChange={(event) => updateRule(index, { keywordsText: event.target.value })}
                    placeholder="学校、老师、教室"
                    value={rule.keywordsText}
                  />
                </label>
              </div>

              <div className="button-row">
                <label className="dream-rule-toggle">
                  <input checked={rule.enabled} disabled={readOnly || pending} onChange={(event) => updateRule(index, { enabled: event.target.checked })} type="checkbox" />
                  启用
                </label>
                <button className="button button-secondary" disabled={readOnly || pending || themeRules.length <= 1} onClick={() => removeRule(index)} type="button">
                  删除规则
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="button-row">
        <button className="button button-primary" disabled={readOnly || pending} type="submit">
          {pending ? "保存中..." : "保存标签与规则"}
        </button>
      </div>

      {readOnlyMessage ? <div className="notice">{readOnlyMessage}</div> : null}
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice danger-zone">{error}</div> : null}
    </form>
  );
}
