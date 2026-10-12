// Convert a pinned Nexus JSON bestiary without executing upstream code.
import fs from "node:fs";
import path from "node:path";
const [root, revision] = process.argv.slice(2);
if (!root || !/^[a-f0-9]{40}$/.test(revision ?? ""))
  throw new Error(
    "Usage: node scripts/build-nexus-monsters.mjs <Nexus checkout> <40-character revision>",
  );
const input = JSON.parse(
  fs.readFileSync(path.join(root, "data/official/gmg/bestiary.json"), "utf8"),
);
const families = new Map(
  (input.included ?? [])
    .filter((r) => r.type === "families")
    .map((r) => [r.id, r.attributes]),
);
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const ability = (a, prefix = "") =>
  `### ${prefix}${a.name}\n\n${a.description ?? ""}`;
const records = input.data
  .filter((r) => r.type === "monsters")
  .map((resource) => {
    const monster = resource.attributes;
    if (!Number.isInteger(monster.hp) || monster.hp < 1)
      throw new Error(`Invalid HP: ${monster.name}`);
    const familyId = resource.relationships?.family?.data?.id;
    const family = families.get(familyId);
    if (familyId && !family)
      throw new Error(`Missing monster family: ${familyId}`);
    const body = [
      monster.description,
      family?.description,
      ...(family?.abilities ?? []).map((a) => ability(a, `${family.name}: `)),
      ...(monster.abilities ?? []).map((a) => ability(a)),
      "## Actions",
      monster.actionsInstructions,
      ...(monster.actions ?? []).map(
        (a) =>
          `### ${a.name}\n\n${a.damage?.roll ? `[${a.damage.roll}](roll:${encodeURIComponent(a.damage.roll)}) · ` : ""}${a.description ?? ""}`,
      ),
      monster.bloodied ? `## Bloodied\n\n${monster.bloodied}` : "",
      monster.lastStand ? `## Last stand\n\n${monster.lastStand}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    return {
      id: `monster/${slug(monster.name)}`,
      kind: "monster",
      title: monster.name,
      body,
      tags: [
        monster.kind,
        family?.name,
        monster.legendary ? "legendary" : "",
        monster.minion ? "minion" : "",
      ].filter(Boolean),
      category: family?.name || monster.kind || "Nimble bestiary",
      sources: [{ book: "Nimble GMG" }],
      related: [],
      fields: {
        hp: monster.hp,
        level: String(monster.level),
        armor: monster.armor,
        size: monster.size,
        kind: monster.kind || "",
        movement: (monster.movement ?? [])
          .map((m) => `${m.mode || "walk"} ${m.speed}`)
          .join(" · "),
        saves: Object.entries(monster.saves ?? {})
          .map(([k, v]) => `${k.toUpperCase()} ${v >= 0 ? "+" : ""}${v}`)
          .join(" · "),
        legendary: !!monster.legendary,
        minion: !!monster.minion,
      },
    };
  });
if (new Set(records.map((r) => r.id)).size !== records.length)
  throw new Error("Duplicate monster IDs");
const pack = {
  format: "slate-content",
  schemaVersion: 1,
  id: "nimble-nexus-bestiary",
  version: revision,
  name: "Nimble Nexus · GMG bestiary",
  source: {
    url: `https://github.com/dstrelau/nimble.monster/tree/${revision}/data/official/gmg/bestiary.json`,
    revision,
    license: `Nimble © 2025 Nimble Co. ${input.source.license}; source repository AGPL-3.0. Nimble Nexus is independent of Nimble Co.`,
  },
  records,
  terms: [],
  assets: {},
};
fs.writeFileSync(
  "src/content/nexus-monsters.json",
  JSON.stringify(pack, null, 2) + "\n",
);
console.log(
  `Converted ${records.length} monsters with ${families.size} families.`,
);
