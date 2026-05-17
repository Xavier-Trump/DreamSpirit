"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type TimelineFilterFormProps = {
  emotions: string[];
  initialValues: {
    from?: string;
    to?: string;
    emotion?: string;
    clarity?: string;
  };
};

type DateFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
};

type SelectFieldProps = {
  label: string;
  name: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
};

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(value: string) {
  const date = parseDateValue(value);
  if (!date) {
    return "yyyy/mm/日";
  }

  return `${date.getFullYear()}/${`${date.getMonth() + 1}`.padStart(2, "0")}/${`${date.getDate()}`.padStart(2, "0")}`;
}

function useCloseOnOutside(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return ref;
}

function DateField({ label, name, value, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate || new Date());
  const containerRef = useCloseOnOutside(open, () => setOpen(false));
  const monthStart = useMemo(() => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1), [visibleMonth]);
  const days = useMemo(() => {
    const start = new Date(monthStart);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [monthStart]);

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <label className="field-group timeline-filter-field">
      <span className="field-label">{label}</span>
      <input name={name} type="hidden" value={value} />
      <div className="timeline-picker" ref={containerRef}>
        <button className="field-input timeline-picker-trigger" type="button" onClick={() => setOpen((current) => !current)}>
          <span>{formatDateLabel(value)}</span>
          <span aria-hidden="true">▾</span>
        </button>
        {open ? (
          <div className="timeline-picker-popover timeline-calendar-popover">
            <div className="timeline-calendar-header">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="上个月">
                ‹
              </button>
              <strong>
                {monthStart.getFullYear()}年{monthStart.getMonth() + 1}月
              </strong>
              <button type="button" onClick={() => moveMonth(1)} aria-label="下个月">
                ›
              </button>
            </div>
            <div className="timeline-calendar-week">
              {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="timeline-calendar-grid">
              {days.map((date) => {
                const dateValue = formatDateValue(date);
                const outsideMonth = date.getMonth() !== monthStart.getMonth();
                return (
                  <button
                    className={dateValue === value ? "selected" : outsideMonth ? "muted" : undefined}
                    key={dateValue}
                    type="button"
                    onClick={() => {
                      onChange(dateValue);
                      setOpen(false);
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="timeline-calendar-actions">
              <button type="button" onClick={() => onChange("")}>
                清除
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  onChange(formatDateValue(today));
                  setVisibleMonth(today);
                  setOpen(false);
                }}
              >
                今天
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}

function SelectField({ label, name, value, options, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useCloseOnOutside(open, () => setOpen(false));
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <label className="field-group timeline-filter-field">
      <span className="field-label">{label}</span>
      <input name={name} type="hidden" value={value} />
      <div className="timeline-picker" ref={containerRef}>
        <button className="field-input timeline-picker-trigger" type="button" onClick={() => setOpen((current) => !current)}>
          <span>{selected.label}</span>
          <span aria-hidden="true">▾</span>
        </button>
        {open ? (
          <div className="timeline-picker-popover timeline-select-popover">
            {options.map((option) => (
              <button
                className={option.value === value ? "selected" : undefined}
                key={`${name}-${option.value || "all"}`}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  );
}

export function TimelineFilterForm({ emotions, initialValues }: TimelineFilterFormProps) {
  const [from, setFrom] = useState(initialValues.from ?? "");
  const [to, setTo] = useState(initialValues.to ?? "");
  const [emotion, setEmotion] = useState(initialValues.emotion ?? "");
  const [clarity, setClarity] = useState(initialValues.clarity ?? "");

  return (
    <form className="filter-grid" action="/timeline">
      <DateField label="开始日期" name="from" value={from} onChange={setFrom} />
      <DateField label="结束日期" name="to" value={to} onChange={setTo} />
      <SelectField
        label="情绪"
        name="emotion"
        value={emotion}
        onChange={setEmotion}
        options={[{ label: "全部情绪", value: "" }, ...emotions.map((item) => ({ label: item, value: item }))]}
      />
      <SelectField
        label="清晰度"
        name="clarity"
        value={clarity}
        onChange={setClarity}
        options={[
          { label: "全部清晰度", value: "" },
          ...[1, 2, 3, 4, 5].map((item) => ({ label: `${item} 星`, value: `${item}` }))
        ]}
      />
      <div className="filter-actions">
        <button className="button button-primary" type="submit">
          筛选
        </button>
        <Link className="button button-secondary" href="/timeline">
          清空
        </Link>
      </div>
    </form>
  );
}
