import type { Campaign, AppData } from "./model";
import { tableDefinitionSchema } from "./utility-schema";
import {
  packKey,
  packTarget,
  type ContentRecord,
  type ContentPack,
} from "./content-schema";

export type Entry = Omit<ContentRecord, "kind"> & {
  kind: ContentRecord["kind"] | "note";
  target: string;
  pack?: ContentPack;
  snippet?: string;
};
export function contentKind(record: Pick<Entry, "kind" | "fields">) {
  return record.kind === "monster" && record.fields.hazard === true
    ? "hazard"
    : record.kind;
}
function tableText(record: Entry) {
  if (record.kind !== "table") return "";
  const parsed = tableDefinitionSchema.safeParse(record.fields.definition);
  return parsed.success
    ? parsed.data.rows.map((row) => `${row.name} ${row.body}`).join(" ")
    : "";
}
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
export function entries(campaign: Campaign, packs: AppData["packs"]): Entry[] {
  return [
    ...campaign.content.map((r) => ({ ...r, target: `local::${r.id}` })),
    ...campaign.tools
      .filter((t) => t.kind === "note")
      .map((t) => ({
        id: t.id,
        title: t.name,
        kind: "note" as const,
        body: t.body,
        tags: t.tags,
        category: "Campaign notes",
        sources: [],
        related: [],
        fields: {},
        target: `local::${t.id}`,
      })),
    ...packs
      .filter((p) => campaign.packRefs.includes(packKey(p)))
      .flatMap((pack) =>
        pack.records.map((r) => ({
          ...r,
          target: packTarget(pack, r.id),
          pack,
        })),
      ),
  ];
}
export function sectionBody(body: string, anchor: string) {
  const lines = body.split("\n");
  let start = -1,
    level = 0,
    end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const h = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
    if (!h) continue;
    if (start >= 0 && h[1].length <= level) {
      end = i;
      break;
    }
    if (start < 0 && headingId(h[2]) === anchor) {
      start = i;
      level = h[1].length;
    }
  }
  return start < 0 ? null : lines.slice(start, end).join("\n");
}
export function resolveEntry(all: Entry[], target: string): Entry | undefined {
  const [base, anchor] = target.split("#");
  const record = all.find((r) => r.target === base);
  if (!record || !anchor) return record;
  const body = sectionBody(record.body, anchor);
  if (body === null) return undefined;
  const term = record.pack?.terms.find(
    (t) => t.target === `${record.id}#${anchor}`,
  );
  return {
    ...record,
    body,
    target,
    title: term?.term ?? body.split("\n")[0].replace(/^#+\s*/, ""),
  };
}
export function searchContent(all: Entry[], query: string, kind = "all") {
  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const results = all
    .filter((r) => kind === "all" || r.kind === kind || contentKind(r) === kind)
    .filter((r) =>
      words.every((w) =>
        `${r.title} ${r.tags.join(" ")} ${r.category} ${r.body} ${tableText(r)} ${r.kind === "item" ? [r.fields.kind, r.fields.rarity, r.fields.moreInfo].filter((v) => typeof v === "string").join(" ") : ""}`
          .toLowerCase()
          .includes(w),
      ),
    );
  // Terms add anchor-level results and aliases, without manufacturing duplicate records.
  if (kind === "all" || kind === "rule")
    for (const pack of new Set(all.map((e) => e.pack).filter(Boolean))) {
      for (const term of pack!.terms)
        if (
          q &&
          [term.term, ...term.aliases].some((n) => n.toLowerCase().includes(q))
        ) {
          const target = packTarget(pack!, term.target),
            found = resolveEntry(all, target);
          if (found && !results.some((r) => r.target === target))
            results.push({ ...found, title: term.term, snippet: term.preview });
        }
    }
  return results.sort(
    (a, b) =>
      Number(b.title.toLowerCase() === q) -
        Number(a.title.toLowerCase() === q) ||
      Number(b.title.toLowerCase().startsWith(q)) -
        Number(a.title.toLowerCase().startsWith(q)) ||
      a.title.localeCompare(b.title),
  );
}
export function backlinks(all: Entry[], target: string) {
  const base = target.split("#")[0];
  return all.filter(
    (r) =>
      r.target !== base &&
      `${r.body} ${tableText(r)}`.includes(`slate:${encodeURIComponent(base)}`),
  );
}

export function removeCampaignContent(
  campaign: Campaign,
  id: string,
): Campaign {
  const isNote = campaign.tools.some(
    (tool) => tool.id === id && tool.kind === "note",
  );
  const withoutNote = <
    T extends { widgets: Campaign["screens"][number]["widgets"] },
  >(
    layout: T,
  ): T => ({
    ...layout,
    widgets: layout.widgets.filter((widget) => !isNote || widget.toolId !== id),
  });
  return {
    ...campaign,
    content: campaign.content.filter((record) => record.id !== id),
    itemFavourites: campaign.itemFavourites.filter(
      (target) => target !== `local::${id}`,
    ),
    tools: campaign.tools.filter((tool) => !isNote || tool.id !== id),
    screens: campaign.screens.map((screen) => ({
      ...withoutNote(screen),
      undo: screen.undo.map(withoutNote),
      redo: screen.redo.map(withoutNote),
    })),
    layoutPresets: campaign.layoutPresets.map((preset) => ({
      ...withoutNote(preset),
      tools: preset.tools.filter((tool) => !isNote || tool.id !== id),
    })),
  };
}
