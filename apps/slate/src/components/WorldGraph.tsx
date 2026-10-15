import { useId, useLayoutEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Entry } from "../content";
import type { CachedRelationship } from "../relationship-cache";

type Point = { x: number; y: number };
export function WorldGraph({
  entries,
  relationships,
  selected,
  positions,
  select,
  move,
}: {
  entries: Entry[];
  relationships: CachedRelationship[];
  selected: string | null;
  positions: Record<string, Point>;
  select: (target: string) => void;
  move: (target: string, point: Point) => void;
}) {
  const [overview, setOverview] = useState(false),
    [tag, setTag] = useState("");
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [draft, setDraft] = useState<{ target: string; point: Point } | null>(
    null,
  );
  const pointer = useRef<{
    id: number;
    target?: string;
    start: Point;
    origin: Point;
    zoom: number;
    moved: boolean;
  } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const markerId = useId().replace(/:/g, "");
  const [size, setSize] = useState({ width: 800, height: 600 });
  useLayoutEffect(() => {
    const measure = () => {
      const rect = svg.current!.getBoundingClientRect();
      if (rect.width && rect.height)
        setSize({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg.current!);
    return () => observer.disconnect();
  }, []);
  const filtered = relationships.filter(
    (row) =>
      !tag ||
      (tag === "__untagged" ? !row.tags.length : row.tags.includes(tag)),
  );
  const targets = new Set<string>();
  if (selected) targets.add(selected);
  if ((overview || !selected) && !tag)
    for (const entry of entries.filter(
      (entry) => entry.kind === "note" && !entry.pack,
    ))
      targets.add(entry.target);
  for (const row of filtered)
    if (
      overview ||
      row.source === selected ||
      row.targetDocument === selected
    ) {
      targets.add(row.source);
      targets.add(row.targetDocument);
    }
  const visible = [...targets].slice(0, 150);
  const points = new Map(
    visible.map((target, index) => [
      target,
      draft?.target === target
        ? draft.point
        : (positions[target] ??
          (target === selected
            ? { x: 400, y: 300 }
            : {
                x:
                  400 +
                  Math.cos(index * 2.399) * (150 + Math.floor(index / 8) * 60),
                y:
                  300 +
                  Math.sin(index * 2.399) * (150 + Math.floor(index / 8) * 60),
              })),
    ]),
  );
  const edges = new Map<
    string,
    { source: string; target: string; count: number; tags: Set<string> }
  >();
  for (const row of filtered) {
    if (!points.has(row.source) || !points.has(row.targetDocument)) continue;
    const key = JSON.stringify([row.source, row.targetDocument]);
    const edge = edges.get(key) ?? {
      source: row.source,
      target: row.targetDocument,
      count: 0,
      tags: new Set<string>(),
    };
    edge.count++;
    row.tags.forEach((value) => edge.tags.add(value));
    edges.set(key, edge);
  }
  const coordinates = (event: { clientX: number; clientY: number }) => {
    const point = svg.current!.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.current!.getScreenCTM()!.inverse());
  };
  return (
    <section className="world-graph" aria-label="Relationship graph">
      <div className="world-graph-controls">
        <label className="sr-only" htmlFor="world-relationship-tag">
          Filter relationship tags
        </label>
        <select
          id="world-relationship-tag"
          value={tag}
          onChange={(event) => setTag(event.target.value)}
        >
          <option value="">All relationship tags</option>
          <option value="__untagged">Untagged</option>
          {[...new Set(relationships.flatMap((row) => row.tags))]
            .sort()
            .map((value) => (
              <option key={value}>{value}</option>
            ))}
        </select>
        <button
          className="quiet"
          aria-pressed={overview}
          onClick={() => setOverview(!overview)}
        >
          {overview ? "Focused graph" : "Whole world"}
        </button>
        <button
          className="icon-button"
          aria-label="Zoom graph in"
          onClick={() =>
            setView((v) => ({ ...v, zoom: Math.min(3, v.zoom * 1.2) }))
          }
        >
          <Plus size={15} />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom graph out"
          onClick={() =>
            setView((v) => ({ ...v, zoom: Math.max(0.3, v.zoom / 1.2) }))
          }
        >
          <Minus size={15} />
        </button>
        <button
          className="icon-button"
          aria-label="Reset graph view"
          onClick={() => setView({ x: 0, y: 0, zoom: 1 })}
        >
          <RotateCcw size={15} />
        </button>
      </div>
      <svg
        ref={svg}
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-label="World connections"
        className="world-graph-canvas"
        onWheel={(event) => {
          const point = coordinates(event);
          setView((v) => {
            const zoom = Math.max(
              0.3,
              Math.min(3, v.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1)),
            );
            return {
              zoom,
              x:
                point.x -
                size.width / 2 -
                ((point.x - size.width / 2 - v.x) * zoom) / v.zoom,
              y:
                point.y -
                size.height / 2 -
                ((point.y - size.height / 2 - v.y) * zoom) / v.zoom,
            };
          });
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const element = (event.target as Element).closest("[data-target]");
          const target = element?.getAttribute("data-target") ?? undefined;
          pointer.current = {
            id: event.pointerId,
            target,
            start: coordinates(event),
            origin: target ? points.get(target)! : { x: view.x, y: view.y },
            zoom: view.zoom,
            moved: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const p = pointer.current;
          if (!p || p.id !== event.pointerId) return;
          const point = coordinates(event),
            dx = point.x - p.start.x,
            dy = point.y - p.start.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) p.moved = true;
          if (p.target)
            setDraft({
              target: p.target,
              point: {
                x: p.origin.x + dx / p.zoom,
                y: p.origin.y + dy / p.zoom,
              },
            });
          else
            setView((v) => ({ ...v, x: p.origin.x + dx, y: p.origin.y + dy }));
        }}
        onPointerUp={(event) => {
          const p = pointer.current;
          if (!p || p.id !== event.pointerId) return;
          pointer.current = null;
          const point = coordinates(event),
            dx = point.x - p.start.x,
            dy = point.y - p.start.y;
          if (p.target) {
            if (p.moved || Math.abs(dx) + Math.abs(dy) > 3)
              move(p.target, {
                x: p.origin.x + dx / p.zoom,
                y: p.origin.y + dy / p.zoom,
              });
            else select(p.target);
          }
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDraft(null);
        }}
        onPointerCancel={() => {
          pointer.current = null;
          setDraft(null);
        }}
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
          </marker>
        </defs>
        <g
          transform={`translate(${view.x + size.width / 2} ${view.y + size.height / 2}) scale(${view.zoom}) translate(-400 -300)`}
        >
          {[...edges].map(([key, edge]) => {
            const from = points.get(edge.source)!,
              to = points.get(edge.target)!;
            const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
            const fraction = Math.min(0.45, 82 / distance);
            return (
              <g key={key} className="world-edge">
                <path
                  markerEnd={`url(#${markerId})`}
                  d={
                    edge.source === edge.target
                      ? `M ${from.x - 35} ${from.y} C ${from.x - 120} ${from.y - 100}, ${from.x + 120} ${from.y - 100}, ${from.x + 35} ${from.y}`
                      : `M ${from.x + (to.x - from.x) * fraction} ${from.y + (to.y - from.y) * fraction} L ${to.x - (to.x - from.x) * fraction} ${to.y - (to.y - from.y) * fraction}`
                  }
                />
                <title>{`${edge.count} declarations · ${[...edge.tags].join(", ") || "untagged"}`}</title>
              </g>
            );
          })}
          {visible.map((target) => {
            const entry = entries.find((entry) => entry.target === target),
              point = points.get(target)!;
            return (
              <g
                key={target}
                data-target={target}
                role="button"
                tabIndex={0}
                aria-label={`Open ${entry?.title ?? target}`}
                className={`world-node ${target === selected ? "selected" : ""} ${!entry ? "missing" : ""}`}
                transform={`translate(${point.x} ${point.y})`}
                onKeyDown={(event) => {
                  if (["Enter", " "].includes(event.key)) {
                    event.preventDefault();
                    select(target);
                  }
                }}
              >
                <rect x={-78} y={-26} width={156} height={52} rx={9} />
                <text textAnchor="middle" y={-2}>
                  {(entry?.title ?? "Missing reference").slice(0, 24)}
                </text>
                <text className="node-kind" textAnchor="middle" y={15}>
                  {entry?.category.slice(0, 28) ||
                    entry?.kind ||
                    target.slice(0, 28)}
                </text>
                <title>{entry?.title ?? `Missing: ${target}`}</title>
              </g>
            );
          })}
        </g>
      </svg>
      <p className="hint world-graph-hint">
        Drag nodes to arrange; drag empty space to pan. Scroll or use +/− to
        zoom.
        {targets.size > 150 &&
          " Showing 150 nodes; focus a document or filter tags to narrow the graph."}
      </p>
    </section>
  );
}
