// Build an optional reference pack from a pinned CC-BY-4.0 Markdown conversion.
// No upstream scripts or code are executed. Normal app builds need no network.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const revision = "f1f5060fd975aa2ffc3e4b336560ded479934d80";
const repository = "https://github.com/your5e/5e-srd-markdown";
const sourcePath = "dnd/521/SRD_CC_v5.2.1.md";
const directory =
  process.argv.find((a, i) => i > 1 && !a.startsWith("--")) ??
  path.join(root, "work/srd");
if (process.argv.includes("--download")) {
  await fs.mkdir(directory, { recursive: true });
  for (const file of ["SRD_CC_v5.2.1.md", "breakdown.txt"]) {
    const response = await fetch(
      `https://raw.githubusercontent.com/your5e/5e-srd-markdown/${revision}/dnd/521/${file}`,
    );
    if (!response.ok)
      throw new Error(`Cannot fetch pinned SRD source: ${response.status}`);
    await fs.writeFile(
      path.join(directory, file),
      new Uint8Array(await response.arrayBuffer()),
    );
  }
}
const source = await fs.readFile(
  path.join(directory, "SRD_CC_v5.2.1.md"),
  "utf8",
);
if (
  createHash("sha256").update(source).digest("hex") !==
  "e4f4803e7cef3d33f42555616fae75abc72ec4f3d79ba1bf344afc906504bec2"
)
  throw new Error("The pinned SRD source checksum changed");
const breakdown = await fs.readFile(
  path.join(directory, "breakdown.txt"),
  "utf8",
);
if (
  createHash("sha256").update(breakdown).digest("hex") !==
  "350ccd75f06232cc1277d9a5623c1a7c6bde8235ec66412ac37b36455389b8a2"
)
  throw new Error("The pinned SRD breakdown checksum changed");
if (source.includes("\ufffd") || !source.startsWith("# Legal Information\n"))
  throw new Error("Unexpected SRD source encoding or format");
const lines = source.split("\n");
const slug = (s) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const cleanTitle = (s) =>
  s
    .replace(/\\/g, "")
    .replace(/\s*\[Condition\]$/, "")
    .trim();
const license =
  'This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.';
const pack = {
  format: "slate-content",
  schemaVersion: 1,
  id: "srd-5-2024",
  version: "5.2.1.2",
  name: "5.5e SRD 5.2.1 · 2024 rules",
  system: "dnd-5e-2024",
  referenceOnly: true,
  source: {
    url: "https://www.dndbeyond.com/srd",
    revision: "5.2.1",
    license:
      license +
      " Markdown conversion by your5e; adapted for Slate with formatting and reference-link changes.",
  },
  records: [],
  terms: [],
  assets: {},
};
const covered = new Set();
const groups = new Map();
for (const match of breakdown.matchAll(
  /^\s*(\d+)\s+(\d+)\s+(extract|append)\s+"([^"]+)"/gm,
)) {
  const [, start, end, operation, name] = match;
  if (
    +start < 1 ||
    +end > lines.length ||
    +end < +start ||
    (operation === "extract" && groups.has(name))
  )
    throw new Error("Invalid breakdown range");
  const group = groups.get(name) ?? { name, ranges: [] };
  group.ranges.push([+start, +end]);
  groups.set(name, group);
  for (let i = +start - 1; i < +end; i++) covered.add(i);
}
function addRecord(group, explicit = {}) {
  const category = group.name.split("/")[1];
  const title = cleanTitle(group.name.split("/").at(-1).replace(/\.md$/, ""));
  const text = group.ranges
    .map(([a, b]) => lines.slice(a - 1, b).join("\n"))
    .join("\n\n");
  let kind = "rule";
  let referenceType = "rule";
  if (category === "Spells" && /^_(?:Level \d|[A-Za-z]+ Cantrip)/m.test(text))
    kind = "spell";
  if (category === "Classes" && !title.endsWith("Spell List")) kind = "class";
  if (category === "Species" && title !== "Character Species")
    kind = "ancestry";
  if (
    category === "Magic Items" &&
    /^_(?:[A-Z][^\n]+), (?:Common|Uncommon|Rare|Very Rare|Legendary|Artifact|Rarity Varies)/m.test(
      text,
    )
  )
    kind = "item";
  if (category === "Monsters" && /\*\*AC\*\*/.test(text)) kind = "monster";
  if (category === "Glossary" && /\[Condition\\?\]/.test(text.split("\n")[0]))
    referenceType = "condition";
  if (category === "Feats" && title !== "Feats") referenceType = "feat";
  const fields = {
    system: pack.system,
    referenceType: kind === "rule" ? referenceType : kind,
    provenance: {
      url: `${repository}/blob/${revision}/${sourcePath}#L${group.ranges[0][0]}`,
      revision,
      ranges: group.ranges,
    },
  };
  if (kind === "monster") fields.referenceOnly = true;
  if (kind === "spell") {
    const meta = /^_(?:Level (\d) ([A-Za-z]+)|([A-Za-z]+) Cantrip)/m.exec(text);
    fields.level = meta?.[1] ? +meta[1] : 0;
    fields.school = meta?.[2] ?? meta?.[3] ?? "";
    for (const label of ["Casting Time", "Range", "Components", "Duration"]) {
      const value = new RegExp(`^- \\*\\*${label}:\\*\\* (.+)$`, "m").exec(
        text,
      )?.[1];
      if (value)
        fields[
          label.toLowerCase().replace(/ (\w)/g, (_, c) => c.toUpperCase())
        ] = value;
    }
  }
  if (kind === "item") {
    const rarity =
      /, (Common|Uncommon|Rare|Very Rare|Legendary)(?=[_ (,\n]|$)/.exec(
        text,
      )?.[1];
    fields.rarity = rarity?.toLowerCase().replaceAll(" ", "_") ?? "unspecified";
    fields.kind = /^_([^,\n]+),/m.exec(text)?.[1] ?? "Magic item";
  }
  const record = {
    id: group.name
      .replace(/^markdown\//, "")
      .replace(/\.md$/, "")
      .split("/")
      .map(slug)
      .join("/"),
    kind,
    title,
    body: text
      .replace(/^#{1,6} [^\n]+\n+/, "")
      .replace(
        /^(#{1,6}) /gm,
        (_, h) => "#".repeat(Math.max(2, h.length - 1)) + " ",
      )
      .trim(),
    tags: ["5.5e", "2024", "SRD 5.2.1", category, referenceType],
    category,
    sources: [{ book: "System Reference Document 5.2.1" }],
    related: [],
    fields,
    ...explicit,
  };
  if (record.body) pack.records.push(record);
  return record;
}
for (const group of groups.values()) addRecord(group);
// Preserve prose omitted by the upstream file breakdown (including the license).
for (let i = 0; i < lines.length;) {
  if (covered.has(i) || !lines[i].trim()) {
    i++;
    continue;
  }
  const start = i;
  while (i < lines.length && !covered.has(i)) i++;
  const chunk = lines.slice(start, i);
  if (!chunk.some((line) => line.trim() && !line.startsWith("#"))) continue;
  const title =
    chunk.find((line) => line.startsWith("#"))?.replace(/^#+ /, "") ??
    `Source notes ${start + 1}`;
  addRecord({
    name: `markdown/Reference/${title}.md`,
    ranges: [[start + 1, i]],
  });
  for (let k = start; k < i; k++) covered.add(k);
}
// Add direct references for the backgrounds and subclasses inside larger chapters.
for (const parent of [...pack.records]) {
  const pattern =
    parent.kind === "class"
      ? /^(##) [^\n]+ Subclass: (.+)$/gm
      : parent.category === "Backgrounds"
        ? /^(###) (Acolyte|Criminal|Sage|Soldier)$/gm
        : null;
  if (!pattern) continue;
  for (const match of parent.body.matchAll(pattern)) {
    const start = match.index + match[0].length;
    const end = new RegExp(`^#{1,${match[1].length}} `, "m").exec(
      parent.body.slice(start),
    )?.index;
    const id = `${parent.kind === "class" ? "subclasses" : "backgrounds"}/${slug(match[2])}`;
    const body = parent.body
      .slice(start, end === undefined ? undefined : start + end)
      .trim();
    if (!body) continue;
    const kind = parent.kind === "class" ? "subclass" : "background";
    pack.records.push({
      ...parent,
      id,
      kind,
      title: match[2],
      body,
      fields: { ...parent.fields, referenceType: kind },
      related: [parent.id],
    });
    parent.related.push(id);
  }
}
if (new Set(pack.records.map((r) => r.id)).size !== pack.records.length)
  throw new Error("Duplicate reference IDs");
const byName = new Map();
for (const record of pack.records) {
  const key = record.title.toLowerCase();
  byName.set(key, [...(byName.get(key) ?? []), record]);
}
for (const record of pack.records) {
  const link = (title) => {
    const candidates = byName.get(title.toLowerCase());
    const target = candidates?.length === 1 ? candidates[0] : undefined;
    return target && target !== record
      ? `[${title.replace(/[\[\]]/g, "\\$&")}](slate:${encodeURIComponent(`${pack.id}@${pack.version}::${target.id}`)})`
      : null;
  };
  record.body = record.body
    .replace(/_([^_\n]+)_/g, (whole, title) => link(title) ?? whole)
    .replace(/"([^"\n]+)"/g, (whole, title) => link(title) ?? whole);
  pack.terms.push({
    term: record.title,
    aliases: [],
    target: record.id,
    preview: record.body.replace(/[#*_`]/g, "").slice(0, 240),
  });
}
const missing = lines.filter(
  (line, i) => line.trim() && !line.startsWith("#") && !covered.has(i),
);
if (missing.length)
  throw new Error(`Uncovered source prose: ${missing.length} lines`);
const output = JSON.stringify(pack) + "\n";
const bytes = Buffer.byteLength(output);
if (
  bytes > 8 * 1024 * 1024 ||
  pack.records.length > 3000 ||
  pack.terms.length > 2000 ||
  pack.source.license.length > 500
)
  throw new Error("Pack exceeds storage limits");
const destination = path.join(root, "public/content-packs");
await fs.mkdir(destination, { recursive: true });
const filename = `srd-5-2024-${pack.version}.slate-content.json`;
await fs.writeFile(path.join(destination, filename), output);
const catalog = {
  format: "slate-pack-catalog",
  version: 1,
  packs: [
    {
      id: pack.id,
      version: pack.version,
      name: pack.name,
      system: pack.system,
      description:
        "Rules, spells, equipment, magic items, character options and monster references. Reference content only; no D&D combat automation.",
      url: filename,
      bytes,
      sha256: createHash("sha256").update(output).digest("hex"),
      records: pack.records.length,
      source: pack.source,
    },
  ],
};
await fs.writeFile(
  path.join(destination, "catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    records: pack.records.length,
    bytes,
    kinds: pack.records.reduce(
      (counts, r) => ({ ...counts, [r.kind]: (counts[r.kind] ?? 0) + 1 }),
      {},
    ),
    sourceSha256: createHash("sha256").update(source).digest("hex"),
  }),
);
