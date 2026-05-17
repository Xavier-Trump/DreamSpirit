"use client";

import type { KeyboardEvent } from "react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

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

const graphWidth = 840;
const graphHeight = 520;
const nodePalette = ["#ff8c42", "#6dd3ce", "#ffc857", "#8fe3bc", "#ff9393", "#b8a7ff"];

function nodeColor(type: string) {
  const seed = Array.from(type).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return nodePalette[seed % nodePalette.length];
}

function linkKey(link: ElementLink) {
  return `${link.source}-${link.target}`;
}

export function ElementsGraph({ nodes, links }: { nodes: ElementNode[]; links: ElementLink[] }) {
  const [selectedId, setSelectedId] = useState(nodes[0]?.id ?? "");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const positionedNodes = useMemo(() => {
    const centerX = graphWidth / 2;
    const centerY = graphHeight / 2;
    const radius = 190;
    const maxCount = Math.max(1, ...nodes.map((node) => node.count));

    return nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, nodes.length) - Math.PI / 2;
      const weightOffset = (node.count / maxCount) * 34;
      return {
        ...node,
        x: centerX + Math.cos(angle) * (radius - weightOffset),
        y: centerY + Math.sin(angle) * (radius - weightOffset),
        r: 18 + (node.count / maxCount) * 24,
        color: nodeColor(node.type)
      };
    });
  }, [nodes]);

  const nodeMap = new Map(positionedNodes.map((node) => [node.id, node]));
  const activeId = hoveredId || selectedId || positionedNodes[0]?.id || "";
  const selectedNode = nodeMap.get(selectedId);
  const hoveredNode = hoveredId ? nodeMap.get(hoveredId) : null;

  function getRelatedIds(nodeId: string) {
    return new Set(
      links.flatMap((link) => {
        if (link.source === nodeId) {
          return [link.target];
        }
        if (link.target === nodeId) {
          return [link.source];
        }
        return [];
      })
    );
  }

  const relatedIds = getRelatedIds(selectedId);
  const activeRelatedIds = getRelatedIds(activeId);
  const activeLinks = links.filter((link) => link.source === activeId || link.target === activeId);
  const strongestRelatedIds = new Set(
    [...activeLinks]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .flatMap((link) => {
        if (link.source === activeId) {
          return [link.target];
        }
        if (link.target === activeId) {
          return [link.source];
        }
        return [];
      })
  );

  function selectNode(id: string) {
    setSelectedId(id);
    setHoveredId(null);
  }

  function selectByOffset(currentId: string, offset: number) {
    const currentIndex = positionedNodes.findIndex((node) => node.id === currentId);
    const nextIndex = (Math.max(0, currentIndex) + offset + positionedNodes.length) % positionedNodes.length;
    selectNode(positionedNodes[nextIndex]?.id || currentId);
  }

  function handleNodeKeyDown(event: KeyboardEvent<SVGGElement>, nodeId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(nodeId);
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectByOffset(nodeId, 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectByOffset(nodeId, -1);
    }
  }

  function nodeState(nodeId: string) {
    if (activeId === nodeId) {
      return "active";
    }

    if (strongestRelatedIds.has(nodeId)) {
      return "strong";
    }

    if (activeRelatedIds.has(nodeId)) {
      return "related";
    }

    return "muted";
  }

  function isLinkActive(link: ElementLink) {
    return activeId === link.source || activeId === link.target;
  }

  const tooltipX = hoveredNode ? Math.min(graphWidth - 156, Math.max(18, hoveredNode.x + hoveredNode.r + 14)) : 0;
  const tooltipY = hoveredNode ? Math.min(graphHeight - 78, Math.max(18, hoveredNode.y - hoveredNode.r - 16)) : 0;

  if (nodes.length === 0) {
    return (
      <div className="card">
        <div style={{ fontWeight: 800 }}>暂无元素数据</div>
        <p className="helper-text">先为梦境生成 AI 解析，系统会提取人物、地点、物品和动作。</p>
      </div>
    );
  }

  return (
    <div className="graph-layout">
      <div className="graph-canvas" role="img" aria-label="梦境元素关系图谱">
        <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="element-svg">
          <defs>
            <filter id="graph-node-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.42 0 0 0 0 0.83 0 0 0 0 0.81 0 0 0 0.58 0"
              />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="graph-radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(109, 211, 206, 0.2)" />
              <stop offset="68%" stopColor="rgba(109, 211, 206, 0.05)" />
              <stop offset="100%" stopColor="rgba(109, 211, 206, 0)" />
            </radialGradient>
          </defs>

          <circle className="graph-radar" cx={graphWidth / 2} cy={graphHeight / 2} r="214" fill="url(#graph-radar-glow)" />
          <circle className="graph-orbit" cx={graphWidth / 2} cy={graphHeight / 2} r="194" />
          <circle className="graph-orbit graph-orbit-soft" cx={graphWidth / 2} cy={graphHeight / 2} r="126" />

          <g className="graph-links">
            {links.map((link) => {
              const source = nodeMap.get(link.source);
              const target = nodeMap.get(link.target);
              if (!source || !target) {
                return null;
              }

              return (
                <line
                  key={linkKey(link)}
                  className={cn("graph-link", isLinkActive(link) && "active")}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  strokeWidth={Math.min(8, 1 + link.count * 1.5)}
                />
              );
            })}
          </g>

          <g className="graph-active-links">
            {activeLinks.map((link) => {
              const source = nodeMap.get(link.source);
              const target = nodeMap.get(link.target);
              if (!source || !target) {
                return null;
              }

              return (
                <line
                  key={`glow-${linkKey(link)}`}
                  className="graph-link-glow"
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  strokeWidth={Math.min(14, 5 + link.count * 1.9)}
                />
              );
            })}
          </g>

          <g className="graph-nodes">
            {positionedNodes.map((node, index) => {
              const selected = selectedId === node.id;
              const state = nodeState(node.id);
              return (
                <g
                  key={node.id}
                  aria-label={`${node.label}，${node.type}，出现 ${node.count} 次`}
                  className={cn("graph-node", selected && "selected", state)}
                  onBlur={() => setHoveredId(null)}
                  onClick={() => selectNode(node.id)}
                  onFocus={() => setHoveredId(node.id)}
                  onKeyDown={(event) => handleNodeKeyDown(event, node.id)}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  role="button"
                  style={{ animationDelay: `${index * 42}ms` }}
                  tabIndex={0}
                  transform={`translate(${node.x} ${node.y})`}
                >
                  <circle className="graph-node-halo" r={node.r + 13} />
                  <circle className="graph-node-pulse" r={node.r + 4} />
                  <circle className="graph-node-core" r={node.r} fill={node.color} filter={state === "active" ? "url(#graph-node-glow)" : undefined} />
                  <text y={node.r + 24} textAnchor="middle">
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>

          {hoveredNode ? (
            <g className="graph-tooltip" transform={`translate(${tooltipX} ${tooltipY})`}>
              <rect width="138" height="64" rx="12" />
              <text x="14" y="24" className="graph-tooltip-title">
                {hoveredNode.label}
              </text>
              <text x="14" y="46" className="graph-tooltip-meta">
                {hoveredNode.type} · {hoveredNode.count} 次
              </text>
            </g>
          ) : null}
        </svg>
      </div>

      <aside className="graph-side card stack-md">
        <div className="graph-side-content" key={selectedId}>
          <div>
            <div className="field-label">当前元素</div>
            <div className="panel-title" style={{ fontSize: 24 }}>
              {selectedNode?.label ?? "未选择"}
            </div>
          </div>
          {selectedNode ? (
            <>
              <div className="badge-row">
                <span className="chip">类型：{selectedNode.type}</span>
                <span className="chip">出现：{selectedNode.count} 次</span>
              </div>
              <div>
                <div className="field-label">关联元素</div>
                <div className="badge-row" style={{ marginTop: 10 }}>
                  {[...relatedIds].map((id) => {
                    const node = nodeMap.get(id);
                    return node ? (
                      <button
                        key={id}
                        className="chip graph-chip"
                        type="button"
                        onClick={() => selectNode(id)}
                        onMouseEnter={() => setHoveredId(id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {node.label}
                      </button>
                    ) : null;
                  })}
                  {relatedIds.size === 0 ? <span className="helper-text">暂无关联。</span> : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
