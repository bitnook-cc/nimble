// Reuse Slate's validated compatibility adapter; never import upstream code.
import fs from "node:fs";
import { build } from "vite";
const snapshotPath = process.argv[2];
if (!snapshotPath)
  throw new Error(
    "Usage: node scripts/build-nexus-supplement.mjs <snapshot.json>",
  );
await build({
  configFile: false,
  build: {
    lib: { entry: "src/exchange.ts", formats: ["es"], fileName: "exchange" },
    outDir: "work/content-converter",
    emptyOutDir: true,
    minify: false,
  },
});
const { parseExchange } = await import("../work/content-converter/exchange.js");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath));
if (snapshot.format !== "nexus-official-supplement")
  throw new Error("Invalid official supplement.");
const core = JSON.parse(fs.readFileSync("src/content/nexus-core.json")),
  monsters = JSON.parse(fs.readFileSync("src/content/nexus-monsters.json"));
monsters.name = "Nimble Nexus · Official bestiary";
for (const pack of [core, monsters])
  pack.records = pack.records.filter(
    (record) => !record.fields.upstream?.liveSnapshot,
  );
const converted = [],
  warnings = [];
for (const entry of snapshot.records) {
  const preview = parseExchange(
    JSON.stringify({ ...entry.document, source: entry.source }),
  );
  if (preview.records.length !== 1)
    throw new Error(`Expected one definition: ${entry.name}`);
  const record = preview.records[0];
  record.id = `${record.kind}/nexus/${entry.document.data.id}`;
  record.title = entry.name;
  record.category = `${entry.source.name} / ${{ class: "Classes", subclass: "Subclasses", ancestry: "Ancestries", background: "Backgrounds", monster: "Monsters", table: "Tables" }[record.kind]}`;
  record.sources = [{ book: entry.source.name }];
  record.tags = [record.kind, entry.source.name];
  record.fields.upstream = {
    liveSnapshot: true,
    source: entry.source,
    contributor: entry.contributor,
    url: `${snapshot.url}/${entry.kind}/${entry.document.data.id}`,
    retrievedAt: snapshot.retrievedAt,
  };
  (record.kind === "monster" ? monsters : core).records.push(record);
  converted.push({ kind: record.kind, id: record.id, name: record.title });
  warnings.push(...preview.warnings);
}
for (const pack of [core, monsters]) {
  if (
    new Set(pack.records.map((record) => record.id)).size !==
    pack.records.length
  )
    throw new Error("Duplicate supplementary record IDs.");
  fs.writeFileSync(
    `src/content/nexus-${pack === core ? "core" : "monsters"}.json`,
    JSON.stringify(pack, null, 2) + "\n",
  );
}
const manifest = JSON.parse(
  fs.readFileSync("src/content/nexus-conversion.json"),
);
manifest.counts.records = core.records.length;
manifest.counts.byKind = core.records.reduce(
  (counts, record) => (
    (counts[record.kind] = (counts[record.kind] ?? 0) + 1),
    counts
  ),
  {},
);
manifest.supplement = {
  retrievedAt: snapshot.retrievedAt,
  coverage: snapshot.coverage,
  records: converted,
  warnings,
};
fs.writeFileSync(
  "src/content/nexus-conversion.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Bundled ${converted.length} additional official records: ${core.records.length} core, ${monsters.records.length} monsters.`,
);
