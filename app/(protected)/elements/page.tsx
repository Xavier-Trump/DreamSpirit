import { redirect } from "next/navigation";

import { ElementsGraph } from "@/components/elements-graph";
import { getViewer } from "@/lib/demo";
import { getDreamsByUser } from "@/lib/dreams";

type ElementNode = {
  id: string;
  label: string;
  type: string;
  count: number;
};

type ElementLink = {
  source: string;
  target: string;
  count: number;
};

function getNodeId(type: string, normalized: string) {
  return `${type}:${normalized}`;
}

export default async function ElementsPage() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const dreams = await getDreamsByUser(viewer.id);
  const nodeMap = new Map<string, ElementNode>();
  const linkMap = new Map<string, ElementLink>();
  const typeMap = new Map<string, number>();

  for (const dream of dreams) {
    const dreamNodeIds = new Set<string>();

    for (const element of dream.elements) {
      const id = getNodeId(element.type, element.normalized);
      const existing = nodeMap.get(id);
      const count = element.count || 1;
      typeMap.set(element.type, (typeMap.get(element.type) ?? 0) + count);

      if (existing) {
        existing.count += count;
      } else {
        nodeMap.set(id, {
          id,
          label: element.normalized,
          type: element.type,
          count
        });
      }
      dreamNodeIds.add(id);
    }

    const ids = [...dreamNodeIds].sort();
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const key = `${ids[i]}__${ids[j]}`;
        const existing = linkMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          linkMap.set(key, {
            source: ids[i],
            target: ids[j],
            count: 1
          });
        }
      }
    }
  }

  const nodes = [...nodeMap.values()].sort((a, b) => b.count - a.count).slice(0, 14);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const links = [...linkMap.values()]
    .filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
    .sort((a, b) => b.count - a.count)
    .slice(0, 28);
  const topElements = [...nodeMap.values()].sort((a, b) => b.count - a.count).slice(0, 12);
  const typeStats = [...typeMap.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="stack-lg">
      <section className="app-panel stack-lg">
        <div className="stack-sm">
          <span className="brand-mark">
            <span className="brand-orb" />
            Element Graph
          </span>
          <h1 className="section-title">把梦境里的碎片，织成你的专属图谱</h1>
          <p className="muted-text">
            节点越大，元素出现越频繁；连线越粗，说明它们在梦里的关联越强
          </p>
        </div>
      </section>

      <section className="app-panel stack-lg">
        <ElementsGraph nodes={nodes} links={links} />
      </section>

      <section className="insights-grid">
        <div className="app-panel stack-md">
          <h2 className="panel-title">高频元素</h2>
          {topElements.length === 0 ? (
            <p className="helper-text">还没有可统计的元素。</p>
          ) : (
            topElements.map((element) => (
              <div className="stack-sm" key={element.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{element.label}</span>
                  <span className="helper-text">{element.count}</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${Math.min(100, element.count * 18)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="app-panel stack-md">
          <h2 className="panel-title">元素类型</h2>
          {typeStats.length === 0 ? (
            <p className="helper-text">生成解析后会出现人物、地点、物品、动作等分类。</p>
          ) : (
            typeStats.map(([type, count]) => (
              <div className="stack-sm" key={type}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{type}</span>
                  <span className="helper-text">{count}</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${Math.min(100, count * 14)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="app-panel stack-md">
          <h2 className="panel-title">关系密度</h2>
          <div className="metric-card">
            <div className="metric-label">节点</div>
            <div className="metric-value">{nodes.length}</div>
            <p className="helper-text">当前呈现最常出现的前 {nodes.length} 个元素。</p>
          </div>
          <div className="metric-card">
            <div className="metric-label">关联</div>
            <div className="metric-value">{links.length}</div>
            <p className="helper-text">来自同一梦境中共同出现的元素组合。</p>
          </div>
        </div>
      </section>
    </div>
  );
}
