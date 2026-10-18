import type { Entry } from "./content";
import type { CachedRelationship } from "./relationship-cache";

export type GraphMode = "focused" | "neighborhood" | "world";
export type GraphPoint = { x: number; y: number };
export type GraphNode = {
  id: string;
  target?: string;
  title: string;
  subtitle: string;
  parent?: string;
  members?: string[];
  children?: GraphNode[];
};
export type GraphEdge = {
  source: string;
  target: string;
  count: number;
  tags: Set<string>;
};
export const HUB_DEGREE = 12;
const FANOUT = 8;
const order = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function graphEdgeEndpoints(from: GraphPoint, to: GraphPoint) {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  // Intersect the rectangular node bounds, rather than a circle that leaves
  // diagonal and vertical edges floating far from the actual card.
  const fraction = Math.min(0.45, 82 / Math.abs(dx), 30 / Math.abs(dy));
  return {
    start: { x: from.x + dx * fraction, y: from.y + dy * fraction },
    end: { x: to.x - dx * fraction, y: to.y - dy * fraction },
  };
}

/** Scope is computed before grouping: a collapsed hub never shortens a hop. */
export function graphHierarchy(
  entries: Entry[],
  relationships: CachedRelationship[],
  selected: string | null,
  mode: GraphMode,
  tag = "",
) {
  const records = new Map(entries.map((entry) => [entry.target, entry]));
  const rows = relationships.filter(
    (row) =>
      !tag ||
      (tag === "__untagged" ? !row.tags.length : row.tags.includes(tag)),
  );
  const neighbors = new Map<string, Set<string>>();
  for (const row of rows) {
    for (const [a, b] of [
      [row.source, row.targetDocument],
      [row.targetDocument, row.source],
    ]) {
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (a !== b) neighbors.get(a)!.add(b);
    }
  }
  const scope = new Set<string>();
  if (mode === "world" || !selected) {
    neighbors.forEach((_, target) => scope.add(target));
    if (!tag)
      entries
        .filter((entry) => entry.kind === "note" && !entry.pack)
        .forEach((entry) => scope.add(entry.target));
  } else {
    let frontier = [selected];
    scope.add(selected);
    for (let hop = 0; hop < (mode === "focused" ? 1 : 2); hop++) {
      const next: string[] = [];
      for (const target of frontier)
        for (const neighbor of neighbors.get(target) ?? []) {
          if (!scope.has(neighbor)) {
            scope.add(neighbor);
            next.push(neighbor);
          }
        }
      frontier = next;
    }
  }
  if (selected) scope.add(selected);
  const hubs = new Set(
    [...scope].filter(
      (target) => (neighbors.get(target)?.size ?? 0) >= HUB_DEGREE,
    ),
  );
  const buckets = new Map<
    string,
    { owner?: string; title: string; members: string[] }
  >();
  const assigned = new Set<string>();
  const bucket = (
    key: string,
    title: string,
    target: string,
    owner?: string,
  ) => {
    const group = buckets.get(key) ?? { owner, title, members: [] };
    group.members.push(target);
    buckets.set(key, group);
  };
  for (const target of [...scope].sort(order)) {
    if (target === selected || hubs.has(target)) continue;
    const owners = [...(neighbors.get(target) ?? [])].filter((id) =>
      hubs.has(id),
    );
    // Shared connections stay visible as bridges between hubs.
    if (owners.length !== 1) continue;
    const owner = owners[0],
      entry = records.get(target);
    const kind = entry?.category || entry?.kind || "Missing references";
    bucket(JSON.stringify([owner, kind]), kind, target, owner);
  }
  for (const [key, group] of buckets) {
    if (group.members.length < 6) buckets.delete(key);
    else group.members.forEach((id) => assigned.add(id));
  }
  // Dense graphs without a single hub still have a complete, navigable overview.
  const remainder = [...scope].filter(
    (id) => !assigned.has(id) && id !== selected && !hubs.has(id),
  );
  if (remainder.length > 60) {
    for (const target of remainder.sort(order)) {
      const entry = records.get(target);
      const label = [
        entry?.pack?.name ?? "Campaign",
        entry?.category || entry?.kind || "Missing references",
      ].join(" · ");
      bucket(JSON.stringify(["overview", label]), label, target);
      assigned.add(target);
    }
  }
  const page = (target: string, parent?: string): GraphNode => {
    const entry = records.get(target);
    return {
      id: target,
      target,
      title: entry?.title ?? "Missing reference",
      subtitle: entry?.category || entry?.kind || target,
      parent,
    };
  };
  const collection = (
    id: string,
    title: string,
    members: string[],
    parent?: string,
  ): GraphNode => {
    const width = Math.ceil(members.length / FANOUT);
    const children: GraphNode[] = [];
    if (members.length <= FANOUT)
      children.push(...members.map((target) => page(target, id)));
    else
      for (let start = 0; start < members.length; start += width) {
        const batch = members.slice(start, start + width);
        const first = records.get(batch[0])?.title ?? batch[0];
        const last = records.get(batch.at(-1)!)?.title ?? batch.at(-1)!;
        children.push(
          collection(`${id}/${start}`, `${first} – ${last}`, batch, id),
        );
      }
    return {
      id,
      title,
      subtitle: `${members.length} pages`,
      parent,
      members,
      children,
    };
  };
  const roots = [...scope]
    .filter((id) => !assigned.has(id))
    .sort(order)
    .map((target) => page(target));
  for (const [key, group] of buckets) {
    group.members.sort(
      (a, b) =>
        order(records.get(a)?.title ?? a, records.get(b)?.title ?? b) ||
        order(a, b),
    );
    roots.push(
      collection(`group:${key}`, group.title, group.members, group.owner),
    );
  }
  return {
    roots,
    rows: rows.filter(
      (row) => scope.has(row.source) && scope.has(row.targetDocument),
    ),
    total: scope.size,
  };
}

/** Project the hierarchy without altering any Markdown or relationship rows. */
export function projectGraph(
  hierarchy: ReturnType<typeof graphHierarchy>,
  detail: number,
  expanded: ReadonlySet<string>,
  collapsed: ReadonlySet<string> = new Set(),
  zoomRoots?: ReadonlySet<string>,
) {
  const nodes: GraphNode[] = [];
  const paths = new Map<string, string[]>();
  const edges = new Map<string, GraphEdge>();
  const edge = (source: string, target: string, row?: CachedRelationship) => {
    const key = JSON.stringify([source, target]);
    const value = edges.get(key) ?? {
      source,
      target,
      count: 0,
      tags: new Set<string>(),
    };
    if (row) {
      value.count++;
      row.tags.forEach((tag) => value.tags.add(tag));
    }
    edges.set(key, value);
  };
  const visit = (
    node: GraphNode,
    depth: number,
    path: string[],
    root: string,
  ) => {
    nodes.push(node);
    const next = [...path, node.id];
    if (!node.members) {
      paths.set(node.id, next);
      return;
    }
    node.members.forEach((target) => paths.set(target, next));
    if (
      !collapsed.has(node.id) &&
      (expanded.has(node.id) ||
        (depth < detail && (!zoomRoots || zoomRoots.has(root))))
    ) {
      for (const child of node.children ?? []) {
        edge(node.id, child.id);
        visit(child, depth + 1, next, root);
      }
    }
  };
  for (const root of hierarchy.roots)
    visit(root, 0, root.parent ? [root.parent] : [], root.id);
  for (const root of hierarchy.roots)
    if (root.members && root.parent) edge(root.parent, root.id);
  for (const row of hierarchy.rows) {
    const source = paths.get(row.source)!,
      target = paths.get(row.targetDocument)!;
    if (source.length === 1 && target[0] === row.source && target.length > 1) {
      for (let index = 1; index < target.length; index++)
        edge(target[index - 1], target[index], row);
    } else if (
      target.length === 1 &&
      source[0] === row.targetDocument &&
      source.length > 1
    ) {
      for (let index = source.length - 1; index > 0; index--)
        edge(source[index], source[index - 1], row);
    } else if (
      source.at(-1) !== target.at(-1) ||
      row.source === row.targetDocument
    )
      edge(source.at(-1)!, target.at(-1)!, row);
  }
  return {
    nodes,
    edges: [...edges.values()].sort(
      (a, b) => order(a.source, b.source) || order(a.target, b.target),
    ),
    total: hierarchy.total,
  };
}

/** A spanning forest reserves a row for every leaf. Saved positions are respected. */
export function layoutGraph(
  graph: ReturnType<typeof projectGraph>,
  selected: string | null,
  saved: Record<string, GraphPoint> = {},
) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = new Map(
    graph.nodes.map((node) => [node.id, new Set<string>()]),
  );
  for (const edge of graph.edges) {
    if (edge.source === edge.target) continue;
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }
  const children = new Map(
    graph.nodes.map((node) => [node.id, [] as string[]]),
  );
  const visited = new Set<string>(),
    roots: string[] = [];
  const order = [...nodes.keys()].sort(
    (a, b) =>
      Number(!!nodes.get(a)?.parent) - Number(!!nodes.get(b)?.parent) ||
      Number(!!nodes.get(a)?.members) - Number(!!nodes.get(b)?.members) ||
      a.localeCompare(b),
  );
  if (selected && nodes.has(selected)) order.unshift(selected);
  for (const root of order) {
    if (visited.has(root)) continue;
    roots.push(root);
    visited.add(root);
    const queue = [root];
    for (let index = 0; index < queue.length; index++) {
      const source = queue[index];
      const ordered = [
        ...(nodes.get(source)?.children?.map((child) => child.id) ?? []),
        ...(adjacency.get(source) ?? []),
      ];
      for (const target of ordered) {
        if (!nodes.has(target)) continue;
        if (visited.has(target)) continue;
        const parent = nodes.get(target)?.parent;
        if (parent && nodes.has(parent) && parent !== source) continue;
        visited.add(target);
        children.get(source)!.push(target);
        queue.push(target);
      }
    }
  }
  const points = new Map<string, GraphPoint>();
  let row = 0;
  const place = (id: string, depth: number): number => {
    const branch = children.get(id)!;
    const ys = branch.map((child) => place(child, depth + 1));
    const y = ys.length ? (ys[0] + ys.at(-1)!) / 2 : row++ * 86;
    points.set(id, { x: depth * 210, y });
    return y;
  };
  for (const root of roots) {
    place(root, 0);
    row++;
  }
  const anchor = points.get(selected ?? roots[0]) ?? { x: 0, y: 0 };
  for (const [id, point] of points)
    points.set(id, {
      x: point.x - anchor.x + 400,
      y: point.y - anchor.y + 300,
    });
  // Move generated nodes out of the way of manually placed pages, preserving
  // every saved coordinate (including intentional manual overlaps).
  const occupied = Object.entries(saved)
    .filter(([id]) => nodes.has(id))
    .map(([, point]) => point);
  for (const [id, point] of points) {
    if (saved[id]) {
      points.set(id, saved[id]);
      continue;
    }
    while (
      occupied.some(
        (other) =>
          Math.abs(other.x - point.x) < 180 && Math.abs(other.y - point.y) < 72,
      )
    )
      point.y += 86;
    occupied.push(point);
  }
  return points;
}
