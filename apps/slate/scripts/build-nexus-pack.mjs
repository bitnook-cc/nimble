// Convert a pinned local Nexus checkout; never execute its MDX or TypeScript.
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import ts from "typescript";
import { createHash } from "node:crypto";
const {
  officialKind: kinds,
  officialLabel: label,
  renderOfficialAttributes: render,
  renderOfficialTable,
} = await import(
  `data:text/javascript;base64,${Buffer.from(
    ts.transpileModule(
      fs.readFileSync(
        new URL("../src/official-content.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
  ).toString("base64")}`
);

const root = process.argv[2];
const revision = process.argv[3];
if (!root || !/^[a-f0-9]{40}$/.test(revision ?? ""))
  throw new Error(
    "Usage: node scripts/build-nexus-pack.mjs <Nexus checkout> <40-character revision> <official items snapshot>",
  );
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
const pack = {
  format: "slate-content",
  schemaVersion: 1,
  id: "nimble-nexus",
  version: revision,
  name: "Nimble Nexus · Official rules, heroes & equipment",
  source: {
    url: `https://github.com/dstrelau/nimble.monster/tree/${revision}`,
    revision,
    license:
      "Nimble © 2025 Nimble Co. Nimble 3rd Party Creator License v2.0; source repository AGPL-3.0. Nimble Nexus is independent of Nimble Co. Movement/reference illustrations by Josh Park (swingsetpark).",
  },
  records: [],
  terms: [],
  assets: {},
};
const link = (id) =>
  `slate:${encodeURIComponent(`${pack.id}@${pack.version}::${id}`)}`;
const warnings = [];
function literal(node) {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((p) => {
        if (!ts.isPropertyAssignment(p))
          throw new Error("Unsupported category metadata");
        return [p.name.text, literal(p.initializer)];
      }),
    );
  throw new Error("Category metadata must contain literal data only");
}
const source = ts.createSourceFile(
  "categories.ts",
  read("lib/rules/categories.ts"),
  ts.ScriptTarget.Latest,
  true,
);
let hierarchy;
function walk(node) {
  if (
    ts.isVariableDeclaration(node) &&
    node.name.getText(source) === "RULE_GROUPS"
  )
    hierarchy = literal(node.initializer);
  ts.forEachChild(node, walk);
}
walk(source);
if (!hierarchy) throw new Error("Missing rules hierarchy");
const locations = new Map();
for (const g of hierarchy)
  for (const c of g.categories)
    for (const s of c.sections)
      s.ruleSlugs.forEach((id, order) =>
        locations.set(id, {
          category: `${g.label} / ${c.label} / ${s.label}`,
          order,
        }),
      );
const terms = parse(read("data/rules/terms.yaml"));
pack.terms = terms.map((t) => ({
  term: t.term,
  aliases: t.aliases ?? [],
  target: t.href.replace("/rules/", "rule/"),
  preview: t.preview,
}));
const termMap = new Map(
  pack.terms.flatMap((t) =>
    [t.term, ...t.aliases].map((n) => [n.toLowerCase(), t.target]),
  ),
);
const documents = fs
  .readdirSync(path.join(root, "data/official"), { recursive: true })
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => ({
    file: `data/official/${file.replaceAll("\\", "/")}`,
    document: JSON.parse(read(`data/official/${file}`)),
  }));
const schools = {
  data: documents.flatMap(({ document, file }) =>
    document.data
      .filter((resource) => resource.type === "spell-schools")
      .map((resource) => ({ ...resource, source: document.source, file })),
  ),
};
const schoolMap = new Map(
  schools.data.map((s) => [
    s.attributes.name,
    `school/${slug(s.attributes.name)}`,
  ]),
);
function convert(body, id) {
  body = body.replace(/<AdvantageDisadvantageExamples\s*\/>/g, () => {
    warnings.push(`${id}: interactive examples replaced with explanatory text`);
    return "\n> For an example, roll 2d20 and keep the higher die for advantage, or the lower die for disadvantage. Use Slate’s dice roller to try it.\n";
  });
  body = body
    .replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/g, (tag, src) => {
      if (!/^\/images\/reference\/[a-zA-Z0-9_.-]+\.(webp|png|jpg)$/.test(src))
        throw new Error(`Unsupported image ${src}`);
      const bytes = fs.readFileSync(path.join(root, "public", src));
      pack.assets[src] =
        `data:image/${src.endsWith(".webp") ? "webp" : src.endsWith(".png") ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
      return `\n![${tag.match(/alt="([^"]*)"/)?.[1] ?? "Diagram"}](${src})\n`;
    })
    .replace(/<\/?div\b[^>]*>/g, "");
  if (/<[A-Za-z][^>]*>|^\s*(?:import|export)\s/m.test(body))
    throw new Error(`Unconverted MDX in ${id}`);
  body = body
    .replace(
      /\{\{dice:([^}]+)\}\}/g,
      (_, formula) => `[${formula}](roll:${encodeURIComponent(formula)})`,
    )
    .replace(/\{\{term:([^}]+)\}\}/g, (_, term) => {
      const target =
        termMap.get(term.toLowerCase()) ??
        (fs.existsSync(path.join(root, "data/rules", slug(term) + ".mdx"))
          ? "rule/" + slug(term)
          : null);
      if (!target) {
        warnings.push(`${id}: unknown term ${term} retained as text`);
        return term;
      }
      return `[${term}](${link(target)})`;
    })
    .replace(/\{\{spell-school:([^}]+)\}\}/g, (_, school) => {
      const target = schoolMap.get(school);
      if (!target) throw new Error(`Unknown school ${school}`);
      return `[${school}](${link(target)})`;
    })
    .replace(
      /\]\(\/rules\/([^)]*)\)/g,
      (_, target) => `](${link(`rule/${target}`)})`,
    );
  return body.trim();
}
const rulesDir = path.join(root, "data/rules");
for (const file of fs
  .readdirSync(rulesDir)
  .filter((f) => f.endsWith(".mdx"))
  .sort()) {
  const raw = read(`data/rules/${file}`).replace(/\r\n/g, "\n");
  const [, meta, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  if (!meta) throw new Error(`Missing metadata ${file}`);
  const m = parse(meta),
    id = file.slice(0, -4),
    location = locations.get(m.variantOf ?? id);
  if (!location) throw new Error(`Missing category ${id}`);
  pack.records.push({
    id: `rule/${id}`,
    kind: "rule",
    title: m.title,
    body: convert(body, id),
    tags: m.keywords,
    category: location.category,
    sources: m.sources,
    related: m.variantOf ? [`rule/${m.variantOf}`] : [],
    fields: { ...location, ...(m.variantOf ? { variantOf: m.variantOf } : {}) },
  });
}
for (const school of schools.data) {
  const s = school.attributes,
    schoolId = schoolMap.get(s.name),
    spellIds = [];
  for (const spell of s.spells) {
    const id = `spell/${slug(s.name)}/${slug(spell.name)}`;
    spellIds.push(id);
    const paragraphs = [
      spell.description,
      ...["damage", "concentration", "upcast", "highLevels"]
        .filter((k) => spell[k])
        .map(
          (k) =>
            `**${{ damage: "Damage", concentration: "Concentration", upcast: "Upcast", highLevels: "Higher levels" }[k]}:** ${spell[k]}`,
        ),
    ].filter(Boolean);
    pack.records.push({
      id,
      kind: "spell",
      title: spell.name,
      body: convert(paragraphs.join("\n\n"), id),
      tags: [
        s.name,
        `tier ${spell.tier}`,
        spell.utility ? "utility" : "combat",
      ],
      category: `Magic / ${s.name}`,
      sources: [{ book: school.source.name }],
      related: [schoolId],
      fields: {
        ...spell,
        school: s.name,
        upstream: { file: school.file, source: school.source },
      },
    });
  }
  pack.records.push({
    id: schoolId,
    kind: "rule",
    title: s.name,
    body:
      convert(s.description, schoolId) +
      "\n\n" +
      spellIds
        .map(
          (id) =>
            `- [${pack.records.find((r) => r.id === id).title}](${link(id)})`,
        )
        .join("\n"),
    tags: ["magic", "school"],
    category: "Magic / Spell schools",
    sources: [{ book: school.source.name }],
    related: [],
    fields: { ...s, upstream: { file: school.file, source: school.source } },
  });
}
const record = (id, kind, attributes, source, file, body) => ({
  id,
  kind,
  title: attributes.name,
  body: convert(body ?? render({ ...attributes, name: undefined }), id),
  tags: [kind, source.abbreviation ?? source.name, attributes.className].filter(
    Boolean,
  ),
  category: `${source.name} / ${{ class: "Classes", subclass: "Subclasses", ancestry: "Ancestries" }[kind] ?? `${label(kind)}s`}`,
  sources: [{ book: source.name }],
  related: [],
  fields: { ...attributes, upstream: { file, source } },
});
const inventory = [];
for (const { file, document } of documents) {
  const ids = [];
  for (const resource of document.data) {
    const a = resource.attributes;
    if (resource.type === "monsters") {
      ids.push(
        `monster/${a.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,
      );
      continue;
    }
    if (resource.type === "spell-schools") {
      ids.push(
        schoolMap.get(a.name),
        ...a.spells.map((spell) => `spell/${slug(a.name)}/${slug(spell.name)}`),
      );
      continue;
    }
    const kind = kinds[resource.type];
    if (kind && kind !== "table") {
      const id = `${kind}/${slug(a.name)}`;
      pack.records.push(record(id, kind, a, document.source, file));
      ids.push(id);
      continue;
    }
    if (resource.type !== "random-tables")
      throw new Error(
        `Unsupported official resource ${resource.type} in ${file}`,
      );
    const tableId = `table/${slug(a.name)}`;
    const body = renderOfficialTable(a);
    const tableRecord = record(
      tableId,
      "table",
      a,
      document.source,
      file,
      body,
    );
    pack.records.push(tableRecord);
    ids.push(tableId);
    for (const table of a.subtables)
      for (const [index, row] of table.rows.entries()) {
        const title = row.cells.item;
        if (!title)
          throw new Error(`Equipment row has no item name in ${file}`);
        const id = `item/equipment/${slug(a.name)}/${slug(table.title)}/${index + 1}-${slug(title)}`;
        const item = record(
          id,
          "item",
          { name: title },
          document.source,
          file,
          Object.entries(row.cells)
            .map(([key, value]) => `**${label(key)}:** ${value}`)
            .join("\n\n"),
        );
        // Enchantment upgrades have the same name in multiple armor groups.
        if (/enchantment/i.test(title))
          item.title = `${title} (${table.title})`;
        item.category = `${document.source.name} / Equipment / ${table.title}`;
        const cost = row.cells.cost
          ?.replaceAll(",", "")
          .match(/^(\d+(?:\.\d+)?)\s*(gp|sp|cp)$/i);
        item.fields = {
          kind: table.title,
          rarity: "unspecified",
          moreInfo: "",
          properties: Object.fromEntries(
            Object.entries(row.cells).filter(
              ([key]) => !["item", "damage", "defense", "cost"].includes(key),
            ),
          ),
          ...(cost
            ? { price: { amount: Number(cost[1]), currency: cost[2] } }
            : {}),
          ...(row.cells.damage ? { damage: row.cells.damage } : {}),
          ...(row.cells.defense ? { armor: row.cells.defense } : {}),
          upstream: {
            file,
            source: document.source,
            table: a.name,
            section: table.title,
            row: index,
            cells: row.cells,
          },
        };
        item.related = [tableId];
        tableRecord.related.push(id);
        pack.records.push(item);
        ids.push(id);
      }
  }
  inventory.push({
    file,
    sha256: createHash("sha256").update(read(file)).digest("hex"),
    resources: document.data.length,
    ids,
  });
}
const classes = pack.records.filter((r) => r.kind === "class");
for (const child of pack.records.filter((r) => r.kind === "subclass")) {
  const parent = classes.find(
    (r) =>
      r.title.toLowerCase().replace(/^the /, "") ===
      child.fields.className.toLowerCase().replace(/^the /, ""),
  );
  if (!parent) throw new Error(`Missing parent class for ${child.title}`);
  child.related.push(parent.id);
  parent.related.push(child.id);
  child.body = `Class: [${parent.title}](${link(parent.id)})\n\n${child.body}`;
}
const itemsPath = process.argv[4];
if (!itemsPath)
  throw new Error("Supply the official-item snapshot as the third argument.");
const itemSnapshot = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
if (
  itemSnapshot.format !== "nexus-official-items-snapshot" ||
  !itemSnapshot.items.length
)
  throw new Error("Invalid official-item snapshot");
for (const item of itemSnapshot.items) {
  if (!itemSnapshot.sources.some((source) => source.name === item.source.name))
    throw new Error(`Unattributed item ${item.name}`);
  const id = `item/nexus/${item.id}`;
  const r = record(
    id,
    "item",
    { name: item.name },
    item.source,
    itemSnapshot.url,
    item.description,
  );
  r.category = `${item.source.name} / Magic items`;
  r.fields = {
    kind: item.kind ?? "",
    rarity: item.rarity,
    moreInfo: convert(item.moreInfo ?? "", id),
    properties: {},
    upstream: {
      source: item.source,
      url: `https://nimble.nexus/items?id=${item.id}`,
      retrievedAt: itemSnapshot.retrievedAt,
      contributor: item.contributor,
    },
  };
  pack.records.push(r);
}
if (new Set(pack.records.map((r) => r.id)).size !== pack.records.length)
  throw new Error("Duplicate content IDs");
const edges = parse(read("data/rules/relations.yaml"));
const connect = (a, b) => {
  const r = pack.records.find((r) => r.id === `rule/${a}`);
  if (!r || !pack.records.some((r) => r.id === `rule/${b}`))
    throw new Error(`Broken relation ${a} ${b}`);
  if (!r.related.includes(`rule/${b}`)) r.related.push(`rule/${b}`);
};
for (const group of edges.groups ?? [])
  for (const a of group) for (const b of group) if (a !== b) connect(a, b);
for (const [hub, members] of Object.entries(edges.hubs ?? {}))
  for (const member of members) {
    connect(hub, member);
    connect(member, hub);
  }
for (const file of fs
  .readdirSync(path.join(rulesDir, "faqs"))
  .filter((f) => f.endsWith(".mdx"))
  .sort()) {
  const [, meta, body] = read(`data/rules/faqs/${file}`)
    .replace(/\r\n/g, "\n")
    .match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const m = parse(meta),
    id = `faq/${file.slice(0, -4)}`;
  pack.records.push({
    id,
    kind: "faq",
    title: m.question,
    body: convert(body, id),
    tags: m.keywords,
    category: "FAQs",
    sources: m.sources ?? [],
    related: m.targets.map((t) => `rule/${t}`),
    fields: { kind: m.kind },
  });
  for (const target of m.targets)
    pack.records.find((r) => r.id === `rule/${target}`)?.related.push(id);
}
for (const r of pack.records)
  for (const match of r.body.matchAll(/slate:([^\s)]+)/g)) {
    const target = decodeURIComponent(match[1]).split("::")[1].split("#")[0];
    if (!pack.records.some((r) => r.id === target))
      throw new Error(`Unresolved reference ${target} in ${r.id}`);
  }
const out = path.resolve("src/content/nexus-core.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(pack, null, 2) + "\n");
fs.writeFileSync(
  path.resolve("src/content/nexus-conversion.json"),
  JSON.stringify(
    {
      revision,
      counts: {
        records: pack.records.length,
        terms: pack.terms.length,
        assets: Object.keys(pack.assets).length,
        byKind: Object.fromEntries(
          [...new Set(pack.records.map((r) => r.kind))].map((kind) => [
            kind,
            pack.records.filter((r) => r.kind === kind).length,
          ]),
        ),
      },
      inventory,
      items: {
        url: itemSnapshot.url,
        retrievedAt: itemSnapshot.retrievedAt,
        count: itemSnapshot.items.length,
        sources: itemSnapshot.sources,
      },
      warnings,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Built ${pack.records.length} records, ${pack.terms.length} terms, ${Object.keys(pack.assets).length} images. ${warnings.length} documented conversions.`,
);
