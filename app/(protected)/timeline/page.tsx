import Link from "next/link";
import { redirect } from "next/navigation";

import { TimelineFilterForm } from "@/components/timeline-filter-form";
import { getViewer } from "@/lib/demo";
import { getDreamsByUser } from "@/lib/dreams";
import { formatDateTime, truncateText } from "@/lib/utils";

type TimelineSearchParams = {
  from?: string;
  to?: string;
  emotion?: string;
  clarity?: string;
};

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function parseDateInput(value?: string) {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function TimelinePage({
  searchParams
}: {
  searchParams: Promise<TimelineSearchParams>;
}) {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const dreams = await getDreamsByUser(viewer.id);
  const allEmotions = [...new Set(dreams.flatMap((dream) => dream.emotions))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const fromDate = parseDateInput(params.from);
  const toDate = parseDateInput(params.to);
  const clarity = params.clarity ? Number(params.clarity) : null;

  const filteredDreams = dreams.filter((dream) => {
    if (fromDate && dream.dreamedAt < fromDate) {
      return false;
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (dream.dreamedAt > endOfDay) {
        return false;
      }
    }
    if (params.emotion && !dream.emotions.includes(params.emotion)) {
      return false;
    }
    if (clarity && dream.clarity !== clarity) {
      return false;
    }
    return true;
  });

  const grouped = filteredDreams.reduce<Array<{ date: string; dreams: typeof filteredDreams }>>((groups, dream) => {
    const key = toDateKey(dream.dreamedAt);
    const group = groups.find((item) => item.date === key);
    if (group) {
      group.dreams.push(dream);
    } else {
      groups.push({ date: key, dreams: [dream] });
    }
    return groups;
  }, []);

  return (
    <div className="stack-lg">
      <section className="app-panel stack-lg timeline-filter-panel">
        <div className="stack-sm">
          <span className="brand-mark">
            <span className="brand-orb" />
            Timeline
          </span>
          <h1 className="section-title">梦境时间轴</h1>
          <p className="muted-text">按时间线查看、筛选你的梦境记录</p>
        </div>

        <TimelineFilterForm emotions={allEmotions} initialValues={params} />
      </section>

      <section className="app-panel stack-md">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <div className="field-label">筛选结果</div>
            <h2 className="panel-title">{filteredDreams.length} 条梦境</h2>
          </div>
          <Link className="button button-secondary" href="/dreams/new">
            记录新梦境
          </Link>
        </div>

        <div className="timeline-list">
          {grouped.length === 0 ? (
            <div className="card">
              <div style={{ fontWeight: 800 }}>没有符合条件的梦境</div>
              <p className="helper-text">换一组筛选条件，或者先记录新的梦境。</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div className="timeline-day" key={group.date}>
                <div className="timeline-date">{group.date}</div>
                <div className="timeline-stack">
                  {group.dreams.map((dream) => (
                    <Link className="timeline-item" href={`/dreams/${dream.id}`} key={dream.id}>
                      <div className="timeline-dot" />
                      <div className="stack-sm">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div style={{ fontWeight: 800 }}>{dream.title}</div>
                          <span className="status-badge">{dream.status}</span>
                        </div>
                        <div className="helper-text">{formatDateTime(dream.dreamedAt)}</div>
                        <p className="muted-text">{truncateText(dream.contentPlain, 180)}</p>
                        <div className="badge-row">
                          {dream.emotions.map((emotion) => (
                            <span className="chip" key={`${dream.id}-${emotion}`}>
                              {emotion}
                            </span>
                          ))}
                          <span className="chip">清晰度 {dream.clarity}/5</span>
                          {dream.isRecurring ? <span className="chip">重复梦境</span> : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
