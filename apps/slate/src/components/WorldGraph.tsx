import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Entry } from "../content";
import type { CachedRelationship } from "../relationship-cache";
import {
  graphHierarchy,
  graphEdgeEndpoints,
  layoutGraph,
  projectGraph,
  type GraphMode,
} from "../world-graph";

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
  const [mode, setMode] = useState<GraphMode>("focused"),
    [tag, setTag] = useState("");
  const [expanded, setExpanded] = useState(new Set<string>());
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const [revealed, setRevealed] = useState(new Set<string>());
  const [groupPositions, setGroupPositions] = useState<Record<string, Point>>(
    {},
  );
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
  const hierarchy = useMemo(
    () => graphHierarchy(entries, relationships, selected, mode, tag),
    [entries, relationships, selected, mode, tag],
  );
  const overview = useMemo(
    () => projectGraph(hierarchy, 0, new Set()),
    [hierarchy],
  );
  const basePoints = useMemo(
    () => layoutGraph(overview, selected),
    [overview, selected],
  );
  const bounds = [...basePoints.values()];
  const minX = Math.min(...bounds.map((p) => p.x), 400) - 100;
  const maxX = Math.max(...bounds.map((p) => p.x), 400) + 100;
  const minY = Math.min(...bounds.map((p) => p.y), 300) - 50;
  const maxY = Math.max(...bounds.map((p) => p.y), 300) + 50;
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const fit = Math.min(
    1,
    Math.max(
      0.2,
      Math.min(
        (size.width - 32) / (maxX - minX),
        (size.height - 32) / (maxY - minY),
      ),
    ),
  );
  const zoom = view.zoom * fit;
  const visibleRoots = new Set(
    hierarchy.roots
      .filter((node) => {
        const point = groupPositions[node.id] ?? basePoints.get(node.id)!;
        return (
          Math.abs((point.x - center.x) * zoom + view.x) <
            size.width / 2 + 80 &&
          Math.abs((point.y - center.y) * zoom + view.y) < size.height / 2 + 50
        );
      })
      .map((node) => node.id),
  );
  const detail = Math.max(
    0,
    Math.floor(Math.log(view.zoom) / Math.log(1.7) + 0.001),
  );
  const visibleRootKey = JSON.stringify([...visibleRoots].sort());
  useEffect(() => {
    setRevealed((previous) => {
      if (!detail) return previous.size ? new Set() : previous;
      const next = new Set<string>([
        ...previous,
        ...JSON.parse(visibleRootKey),
      ]);
      return next.size === previous.size ? previous : next;
    });
  }, [detail, visibleRootKey]);
  // Retain a revealed branch while panning through its descendants. It can
  // collapse again on zoom-out, explicit collapse, or a scope/filter change.
  const zoomRoots = new Set([...visibleRoots, ...revealed]);
  const graph = projectGraph(hierarchy, detail, expanded, collapsed, zoomRoots);
  const savedPositions = { ...positions, ...groupPositions };
  const points = layoutGraph(graph, selected, savedPositions);
  if (draft) points.set(draft.target, draft.point);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const openGroups = new Set(
    graph.nodes.filter((node) => node.parent).map((node) => node.parent!),
  );
  function resetGroups() {
    setExpanded(new Set());
    setCollapsed(new Set());
    setRevealed(new Set());
    setGroupPositions({});
    setView({ x: 0, y: 0, zoom: 1 });
  }
  function activate(id: string) {
    const node = nodes.get(id)!;
    if (node.target) {
      select(node.target);
      return;
    }
    const nextExpanded = new Set([...expanded, ...openGroups]),
      nextCollapsed = new Set(collapsed);
    if (openGroups.has(id)) {
      nextExpanded.delete(id);
      nextCollapsed.add(id);
    } else {
      nextExpanded.add(id);
      nextCollapsed.delete(id);
    }
    const nextGraph = projectGraph(
      hierarchy,
      0,
      nextExpanded,
      nextCollapsed,
      zoomRoots,
    );
    const nextPoints = layoutGraph(nextGraph, selected, savedPositions);
    const branch = [node, ...(node.children ?? [])]
      .filter((child) => nextPoints.has(child.id))
      .map((child) => nextPoints.get(child.id)!);
    const left = Math.min(...branch.map((point) => point.x)) - 96;
    const right = Math.max(...branch.map((point) => point.x)) + 96;
    const top = Math.min(...branch.map((point) => point.y)) - 42;
    const bottom = Math.max(...branch.map((point) => point.y)) + 42;
    const scale = Math.min(
      zoom,
      (size.width - 24) / (right - left),
      (size.height - 24) / (bottom - top),
    );
    setView({
      zoom: scale / fit,
      x: -((left + right) / 2 - center.x) * scale,
      y: -((top + bottom) / 2 - center.y) * scale,
    });
    setExpanded(nextExpanded);
    setCollapsed(nextCollapsed);
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
        <label className="sr-only" htmlFor="world-graph-mode">
          Graph view
        </label>
        <select
          id="world-graph-mode"
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as GraphMode);
            resetGroups();
          }}
        >
          <option value="focused">Focused</option>
          <option value="neighborhood">Neighborhood</option>
          <option value="world">Entire world</option>
        </select>
        <label className="sr-only" htmlFor="world-relationship-tag">
          Filter relationship tags
        </label>
        <select
          id="world-relationship-tag"
          value={tag}
          onChange={(event) => {
            setTag(event.target.value);
            resetGroups();
          }}
        >
          <option value="">All tags</option>
          <option value="__untagged">Untagged</option>
          {[...new Set(relationships.flatMap((row) => row.tags))]
            .sort()
            .map((value) => (
              <option key={value}>{value}</option>
            ))}
        </select>
        <button
          className="icon-button"
          aria-label="Zoom graph in"
          onClick={() =>
            setView((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.2) }))
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
        {graph.nodes.some((node) => node.members) && (
          <button className="quiet" onClick={resetGroups}>
            Collapse groups
          </button>
        )}
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
              Math.min(8, v.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1)),
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
          const element = (event.target as Element).closest("[data-node]");
          const target = element?.getAttribute("data-node") ?? undefined;
          pointer.current = {
            id: event.pointerId,
            target,
            start: coordinates(event),
            origin: target ? points.get(target)! : { x: view.x, y: view.y },
            zoom,
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
            if (p.moved || Math.abs(dx) + Math.abs(dy) > 3) {
              const point = {
                x: p.origin.x + dx / p.zoom,
                y: p.origin.y + dy / p.zoom,
              };
              if (nodes.get(p.target)?.target) move(p.target, point);
              else
                setGroupPositions((previous) => ({
                  ...previous,
                  [p.target!]: point,
                }));
            } else activate(p.target);
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
          transform={`translate(${view.x + size.width / 2} ${view.y + size.height / 2}) scale(${zoom}) translate(${-center.x} ${-center.y})`}
        >
          {graph.edges.map((edge) => {
            const from = points.get(edge.source)!,
              to = points.get(edge.target)!;
            const { start, end } = graphEdgeEndpoints(from, to);
            return (
              <g
                key={JSON.stringify([edge.source, edge.target])}
                className={`world-edge ${edge.count ? "" : "collection"}`}
              >
                <path
                  markerEnd={edge.count ? `url(#${markerId})` : undefined}
                  d={
                    edge.source === edge.target
                      ? `M ${from.x - 35} ${from.y} C ${from.x - 120} ${from.y - 100}, ${from.x + 120} ${from.y - 100}, ${from.x + 35} ${from.y}`
                      : `M ${start.x} ${start.y} L ${end.x} ${end.y}`
                  }
                />
                <title>
                  {edge.count
                    ? `${edge.count} declarations · ${[...edge.tags].join(", ") || "untagged"}`
                    : "Grouped pages"}
                </title>
              </g>
            );
          })}
          {graph.nodes.map((node) => {
            const point = points.get(node.id)!;
            const isGroup = !!node.members;
            return (
              <g
                key={node.id}
                data-node={node.id}
                data-target={node.target}
                data-group={isGroup || undefined}
                role="button"
                tabIndex={0}
                aria-expanded={isGroup ? openGroups.has(node.id) : undefined}
                aria-label={
                  isGroup
                    ? `${openGroups.has(node.id) ? "Collapse" : "Expand"} ${node.title} (${node.members!.length} pages)`
                    : `Open ${node.title}`
                }
                className={`world-node ${node.id === selected ? "selected" : ""} ${isGroup ? "group" : ""} ${node.title === "Missing reference" ? "missing" : ""}`}
                transform={`translate(${point.x} ${point.y})`}
                onKeyDown={(event) => {
                  if (["Enter", " "].includes(event.key)) {
                    event.preventDefault();
                    activate(node.id);
                  }
                }}
              >
                <rect x={-78} y={-26} width={156} height={52} rx={9} />
                <text textAnchor="middle" y={-2}>
                  {node.title.length > 22
                    ? `${node.title.slice(0, 21)}…`
                    : node.title}
                </text>
                <text className="node-kind" textAnchor="middle" y={15}>
                  {isGroup
                    ? `${node.subtitle} · ${openGroups.has(node.id) ? "−" : "+"}`
                    : node.subtitle.slice(0, 28)}
                </text>
                <title>
                  {isGroup
                    ? `${node.title}: ${node.subtitle}. Click to ${openGroups.has(node.id) ? "collapse" : "expand"}, or zoom in to reveal pages.`
                    : node.title}
                </title>
              </g>
            );
          })}
        </g>
      </svg>
      <p className="hint world-graph-hint">
        {graph.total} {graph.total === 1 ? "page" : "pages"} ·{" "}
        {graph.nodes.filter((node) => node.target).length} shown individually.
        {graph.nodes.some((node) => node.members) &&
          " Click groups or zoom in to reveal pages."}{" "}
        Drag nodes to arrange; drag empty space to pan. Scroll or use +/− to
        zoom.
      </p>
    </section>
  );
}
