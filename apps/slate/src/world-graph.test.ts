import { expect, it } from "vitest";
import {
  graphHierarchy,
  graphEdgeEndpoints,
  projectGraph,
  layoutGraph,
  HUB_DEGREE,
  type GraphNode,
} from "./world-graph";
import type { Entry } from "./content";
import type { CachedRelationship } from "./relationship-cache";
import { newNote } from "./notes";
import { documentReferences } from "./document-markdown";
import { referenceMarkdown } from "./references";

const entry = (id: string): Entry => ({
  ...newNote(id, id),
  target: `local::${id}`,
});

it("connects edges to rectangular card boundaries, including vertical and diagonal connections", () => {
  expect(graphEdgeEndpoints({ x: 0, y: 0 }, { x: 210, y: 0 })).toEqual({
    start: { x: 82, y: 0 },
    end: { x: 128, y: 0 },
  });
  expect(graphEdgeEndpoints({ x: 0, y: 0 }, { x: 0, y: 210 })).toEqual({
    start: { x: 0, y: 30 },
    end: { x: 0, y: 180 },
  });
  expect(graphEdgeEndpoints({ x: 0, y: 0 }, { x: -210, y: -210 })).toEqual({
    start: { x: -30, y: -30 },
    end: { x: -180, y: -180 },
  });
});
function row(
  source: string,
  target: string,
  tags: string[] = [],
): CachedRelationship {
  const reference = documentReferences(
    referenceMarkdown(target, `local::${target}`, tags),
    `local::${source}`,
  ).references[0];
  return {
    ...reference,
    campaign: "test",
    key: JSON.stringify([source, target, tags]),
    targetDocument: `local::${target}`,
  };
}
function pages(nodes: GraphNode[]): string[] {
  return nodes.flatMap((node) =>
    node.target ? [node.target] : pages(node.children ?? []),
  );
}
function dense(count = 64) {
  const entries = [
    entry("hero"),
    entry("hub"),
    entry("outside"),
    entry("third-hop"),
    ...Array.from({ length: count }, (_, i) =>
      entry(`page-${String(i).padStart(3, "0")}`),
    ),
  ];
  const rows = [
    row("hub", "hero"),
    ...entries.slice(4).map((entry) => row("hub", entry.id)),
    row("page-000", "third-hop"),
  ];
  return { entries, rows };
}

it("uses one or two real hops in either direction and does not traverse a collapsed hub as one hop", () => {
  const { entries, rows } = dense();
  const focused = graphHierarchy(entries, rows, "local::hero", "focused");
  expect(pages(focused.roots).sort()).toEqual(["local::hero", "local::hub"]);
  const nearby = graphHierarchy(entries, rows, "local::hero", "neighborhood");
  expect(nearby.total).toBe(66);
  expect(new Set(pages(nearby.roots)).size).toBe(66);
  expect(pages(nearby.roots)).not.toContain("local::third-hop");
  expect(pages(nearby.roots)).not.toContain("local::outside");
  const overview = projectGraph(nearby, 0, new Set());
  expect(overview.nodes).toHaveLength(3);
  expect(overview.nodes.find((node) => node.members)?.members).toHaveLength(64);
  expect(
    pages(graphHierarchy(entries, rows, "local::hero", "world").roots),
  ).toContain("local::outside");
});

it("creates bounded nested groups and reveals all pages through zoom or explicit expansion without a 150-page cap", () => {
  const { entries, rows } = dense(512);
  const hierarchy = graphHierarchy(
    entries,
    rows,
    "local::hero",
    "neighborhood",
  );
  const group = hierarchy.roots.find((node) => node.members)!;
  expect(group.children).toHaveLength(8);
  expect(group.children!.every((child) => child.children!.length <= 8)).toBe(
    true,
  );
  const first = projectGraph(hierarchy, 1, new Set());
  expect(first.nodes).toHaveLength(11); // two pages, root collection, eight branches
  expect(first.nodes.filter((node) => node.target)).toHaveLength(2);
  const expanded = projectGraph(
    hierarchy,
    0,
    new Set([group.id, group.children![0].id]),
  );
  expect(expanded.nodes.length).toBeGreaterThan(first.nodes.length);
  const all = projectGraph(hierarchy, 20, new Set());
  expect(all.nodes.filter((node) => node.target)).toHaveLength(514);
  expect(new Set(all.nodes.map((node) => node.id)).size).toBe(all.nodes.length);
  const collapsed = projectGraph(hierarchy, 20, new Set(), new Set([group.id]));
  expect(collapsed.nodes).toHaveLength(3);
  // Zoom only expands groups in the visible area; unrelated groups stay compact.
  expect(
    projectGraph(hierarchy, 20, new Set(), new Set(), new Set()).nodes,
  ).toHaveLength(3);
});

it("keeps the selected page and shared hub bridges visible, counting unique neighbors rather than declarations", () => {
  const { entries, rows } = dense();
  entries.push(entry("hub2"));
  rows.push(...entries.slice(4, 20).map((entry) => row("hub2", entry.id)));
  const graph = projectGraph(
    graphHierarchy(entries, rows, "local::page-020", "world"),
    0,
    new Set(),
  );
  expect(graph.nodes.some((node) => node.target === "local::page-020")).toBe(
    true,
  );
  expect(graph.nodes.some((node) => node.target === "local::page-000")).toBe(
    true,
  );
  const duplicates = Array.from({ length: HUB_DEGREE + 5 }, () =>
    row("hero", "hub"),
  );
  const duplicateGraph = projectGraph(
    graphHierarchy(entries.slice(0, 2), duplicates, "local::hero", "focused"),
    0,
    new Set(),
  );
  expect(duplicateGraph.nodes.every((node) => node.target)).toBe(true);
  expect(duplicateGraph.edges[0].count).toBe(duplicates.length);
});

it("filters before traversal and grouping, retaining missing targets, self-links, direction, counts, and tags", () => {
  const { entries, rows } = dense(32);
  rows.push(
    row("hero", "hub", ["knows"]),
    row("hub", "missing", ["knows"]),
    row("missing", "missing", ["knows"]),
  );
  const filtered = projectGraph(
    graphHierarchy(entries, rows, "local::hero", "neighborhood", "knows"),
    0,
    new Set(),
  );
  expect(filtered.total).toBe(3);
  expect(
    filtered.nodes.find((node) => node.id === "local::missing")?.title,
  ).toBe("Missing reference");
  expect(
    filtered.edges.find(
      (edge) =>
        edge.source === "local::missing" && edge.target === "local::missing",
    )?.count,
  ).toBe(1);
  const hierarchy = graphHierarchy(
    entries,
    rows,
    "local::hero",
    "neighborhood",
  );
  const group = hierarchy.roots.find((node) => node.members)!;
  const graph = projectGraph(hierarchy, 1, new Set());
  expect(
    graph.edges.some(
      (edge) =>
        edge.source === "local::hub" &&
        edge.target === group.id &&
        edge.count === 32,
    ),
  ).toBe(true);
  expect(
    graph.edges.filter(
      (edge) =>
        edge.source === "local::hub" && edge.target.startsWith("local::page"),
    ),
  ).toHaveLength(0);
  expect(
    projectGraph(
      graphHierarchy(entries, rows, "local::hero", "focused", "absent"),
      0,
      new Set(),
    ).nodes.map((node) => node.id),
  ).toEqual(["local::hero"]);
});

it("represents large hub-free overviews completely, including isolated campaign notes", () => {
  const entries = Array.from({ length: 180 }, (_, i) => entry(`note-${i}`));
  const hierarchy = graphHierarchy(entries, [], entries[0].target, "world");
  const overview = projectGraph(hierarchy, 0, new Set());
  expect(overview.nodes.length).toBeLessThan(10);
  expect(overview.total).toBe(180);
  expect(new Set(pages(hierarchy.roots)).size).toBe(180);
  const graph = projectGraph(hierarchy, 20, new Set());
  expect(graph.nodes.filter((node) => node.target)).toHaveLength(180);
  const points = layoutGraph(graph, entries[0].target);
  for (const [id, point] of points)
    for (const [otherId, other] of points) {
      if (id !== otherId)
        expect(
          Math.abs(point.x - other.x) >= 180 ||
            Math.abs(point.y - other.y) >= 72,
        ).toBe(true);
    }
});

it("lays out cycles deterministically without overlaps while preserving manual positions", () => {
  const { entries, rows } = dense();
  rows.push(row("hero", "page-000"), row("page-000", "hero"));
  const graph = projectGraph(
    graphHierarchy(entries, rows, "local::hero", "neighborhood"),
    1,
    new Set(),
  );
  const points = layoutGraph(graph, "local::hero");
  const reversed = projectGraph(
    graphHierarchy(
      [...entries].reverse(),
      [...rows].reverse(),
      "local::hero",
      "neighborhood",
    ),
    1,
    new Set(),
  );
  expect(layoutGraph(reversed, "local::hero")).toEqual(points);
  const saved = { "local::hero": { x: 610, y: 300 } };
  const arranged = layoutGraph(graph, "local::hero", saved);
  expect(arranged.get("local::hero")).toEqual(saved["local::hero"]);
  for (const [id, point] of arranged)
    for (const [otherId, other] of arranged) {
      if (id !== otherId)
        expect(
          Math.abs(point.x - other.x) >= 180 ||
            Math.abs(point.y - other.y) >= 72,
        ).toBe(true);
    }
});
