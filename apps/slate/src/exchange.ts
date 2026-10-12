import { z } from "zod";
import { parseTableImport } from "./utilities";
import {
  tableDefinition,
  remapTableContent,
  mapTableLinks,
} from "./table-content";
import {
  officialKind,
  renderOfficialAttributes,
  renderOfficialTable,
} from "./official-content";
import {
  recordSchema,
  packSchema,
  packTarget,
  referenceHref,
  referenceMarkdown,
  type ContentRecord,
} from "./content-schema";
import { itemFieldsSchema } from "./item-schema";
import { encounterFieldsSchema } from "./encounter-schema";
import { monsterStatsSchema } from "./monster-schema";
import { type Entry } from "./content";
import { campaignSchema, uid, type Campaign } from "./model";

const text = z.string().max(100000);
const name = z.string().trim().min(1).max(160);
const sourceId = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_.-]+$/);
const resourceSchema = z.looseObject({
  type: name,
  id: sourceId,
  attributes: z.record(z.string(), z.unknown()),
  relationships: z.record(z.string(), z.unknown()).optional(),
});
type Resource = z.infer<typeof resourceSchema>;
const documentSchema = z.looseObject({
  data: z.union([resourceSchema, z.array(resourceSchema).max(3000)]),
  included: z.array(resourceSchema).max(3000).default([]),
});
const abilitySchema = z.looseObject({
  name: z.string().trim().max(160),
  description: text.optional(),
  desc: text.optional(),
});
const actionSchema = abilitySchema.extend({
  damage: z.union([text, z.looseObject({ roll: text.optional() })]).optional(),
  target: z.record(z.string(), z.unknown()).optional(),
  range: text.optional(),
});
const phaseSchema = z.union([text, z.looseObject({ description: text })]);
const creatureSchema = z.looseObject({
  name,
  hp: z.number().int().min(1).max(99999).optional(),
  hpPerHero: z.number().int().min(1).max(99999).nullish(),
  level: z.union([z.string().max(40), z.number().finite()]).optional(),
  levelInt: z.number().int().optional(),
  legendary: z.boolean().optional(),
  minion: z.boolean().optional(),
  hazard: z.boolean().optional(),
  subtype: z.enum(["standard", "minion", "legendary", "team"]).optional(),
  armor: z.string().max(80).optional(),
  size: z.string().max(80).optional(),
  kind: z.string().max(160).optional(),
  description: text.optional(),
  moreInfo: text.optional(),
  abilities: z.array(abilitySchema).max(500).optional(),
  actions: z.array(actionSchema).max(500).optional(),
  actionsInstructions: text.optional(),
  actionPreface: text.optional(),
  movement: z
    .array(
      z.looseObject({
        mode: z.string().max(40).optional(),
        speed: z.number().finite().nonnegative(),
      }),
    )
    .max(20)
    .optional(),
  saves: z
    .union([
      text,
      z.record(z.string(), z.union([z.number().finite(), z.string().max(40)])),
    ])
    .optional(),
  bloodied: phaseSchema.optional(),
  bloodiedAt: z.number().int().min(0).max(99999).optional(),
  lastStand: phaseSchema.optional(),
  lastStandHp: z.number().int().min(1).max(99999).optional(),
  lastStandHpPerHero: z.number().int().min(1).max(99999).optional(),
  members: z
    .array(
      z.looseObject({
        name,
        hp: z.number().int().min(1).max(99999),
        hpPerHero: z.number().int().min(1).max(99999).nullish(),
        lastStandHp: z.number().int().min(1).max(99999).optional(),
        lastStandHpPerHero: z.number().int().min(1).max(99999).optional(),
        armor: z.string().max(80).optional(),
        size: z.string().max(80).optional(),
        saves: z
          .union([text, z.record(z.string(), z.union([z.number(), text]))])
          .optional(),
        abilities: z.array(abilitySchema).max(500).default([]),
        actions: z.array(actionSchema).max(500).default([]),
        actionsInstructions: text.optional(),
        actionPreface: text.optional(),
      }),
    )
    .max(20)
    .optional(),
});
const itemSchema = z.looseObject({
  name,
  description: text,
  kind: z.string().max(160).optional(),
  rarity: itemFieldsSchema.shape.rarity,
  moreInfo: text.optional(),
});
const encounterSchema = z.looseObject({
  name,
  description: text.optional(),
  heroCount: z.number().int().min(1).max(100).default(4),
  heroLevel: z.number().finite().min(0).max(100).default(1),
});
const linkSchema = z.looseObject({
  type: name,
  id: sourceId,
  meta: z
    .looseObject({
      quantity: z.number().finite().positive().max(100),
      isPerHero: z.boolean(),
      heroesPerMonster: z.number().int().min(1).max(100).default(1),
    })
    .optional(),
});
const links = (raw: unknown) =>
  z
    .object({
      data: z.union([linkSchema, z.array(linkSchema).max(1000), z.null()]),
    })
    .parse(raw).data;
const idFor = (resource: Pick<Resource, "type" | "id">) =>
  `nexus/${resource.type}/${resource.id}`;
const phase = (value: z.infer<typeof phaseSchema> | undefined) =>
  typeof value === "string" ? value : value?.description;
const saves = (value: unknown) =>
  typeof value === "string"
    ? value
    : value && typeof value === "object"
      ? Object.entries(value)
          .map(([key, val]) => `${key.toUpperCase()} ${val}`)
          .join(" · ")
      : "";
const abilities = (list: z.infer<typeof abilitySchema>[] = []) =>
  list
    .filter((a) => a.name || a.description || a.desc)
    .map(
      (a) =>
        `${a.name ? `### ${a.name}\n\n` : ""}${a.description ?? a.desc ?? ""}`,
    )
    .join("\n\n");
const actions = (list: z.infer<typeof actionSchema>[] = []) =>
  list
    .map((a) => {
      const roll = typeof a.damage === "string" ? a.damage : a.damage?.roll;
      return `${a.name ? `### ${a.name}\n\n` : ""}${roll ? `[${roll}](roll:${encodeURIComponent(roll)}) · ` : ""}${
        a.target
          ? Object.entries(a.target)
              .map(([k, v]) => `(${k} ${String(v)})`)
              .join(" ") + " "
          : ""
      }${a.range ?? ""} ${a.description ?? a.desc ?? ""}`;
    })
    .join("\n\n");
const base = (
  resource: Resource,
  kind: ContentRecord["kind"],
  title: string,
  body: string,
  fields: Record<string, unknown>,
): ContentRecord => ({
  id: idFor(resource),
  kind,
  title,
  body,
  fields,
  tags: [],
  category: "Imported content",
  sources: [],
  related: [],
});
export type ImportPreview = {
  records: ContentRecord[];
  warnings: string[];
  format: string;
};

export function parseExchange(input: string, all: Entry[] = []): ImportPreview {
  if (new TextEncoder().encode(input).length > 8 * 1024 * 1024)
    throw new Error("Import exceeds 8 MiB.");
  const raw: unknown = JSON.parse(input);
  if (raw && typeof raw === "object" && "format" in raw) {
    if (raw.format === "slate-table") {
      const table = parseTableImport(input);
      return {
        records: [
          recordSchema.parse({
            id: uid(),
            kind: "table",
            title: table.name,
            body: "",
            tags: [],
            category: "Imported content",
            fields: { definition: table.definition },
          }),
        ],
        warnings: [],
        format: "Legacy Slate table",
      };
    }
    const portable = z
      .strictObject({
        format: z.literal("slate-records"),
        schemaVersion: z.literal(1),
        records: z.array(recordSchema).min(1).max(1000),
      })
      .parse(raw);
    if (
      new Set(portable.records.map((r) => r.id)).size !==
      portable.records.length
    )
      throw new Error("Duplicate record IDs.");
    return { records: portable.records, warnings: [], format: "Slate records" };
  }
  if (raw && typeof raw === "object" && "CR" in raw) return importNimbrew(raw);
  // Nexus official seed documents omit IDs on primary resources. Only allow
  // that documented shape when the document supplies explicit source metadata.
  let normalized = raw;
  let documentSource: Record<string, unknown> | undefined;
  const seed = z
    .looseObject({
      source: z.record(z.string(), z.unknown()),
      data: z.array(z.unknown()).max(3000),
    })
    .safeParse(raw);
  if (seed.success) {
    documentSource = seed.data.source;
    const generated = seed.data.data.map((value) => {
      const resource = z
        .looseObject({
          type: name,
          id: sourceId.optional(),
          attributes: z.record(z.string(), z.unknown()),
        })
        .parse(value);
      if (resource.id) return resource;
      const title = name.parse(resource.attributes.name);
      let hash = 2166136261;
      for (const char of title)
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
      return {
        ...resource,
        id:
          "seed-" +
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .slice(0, 75) +
          "-" +
          (hash >>> 0).toString(16),
      };
    });
    normalized = { ...seed.data, data: generated };
  }
  const doc = documentSchema.parse(normalized);
  const data = Array.isArray(doc.data) ? doc.data : [doc.data];
  const resources = new Map<string, Resource>();
  for (const resource of [...data, ...doc.included]) {
    const key = idFor(resource),
      old = resources.get(key);
    if (old && JSON.stringify(old) !== JSON.stringify(resource))
      throw new Error(`Conflicting resource: ${key}`);
    resources.set(key, resource);
  }
  const warnings: string[] = [];
  const records: ContentRecord[] = [];
  const targetFor = (type: string, id: string) => {
    const local = `local::${idFor({ type, id })}`;
    if (resources.has(idFor({ type, id }))) return local;
    return (
      all.find((e) => {
        const exchange = e.fields.exchange as
          { resource?: Resource } | undefined;
        return exchange?.resource?.id === id && exchange.resource.type === type;
      })?.target ?? local
    );
  };
  for (const resource of resources.values()) {
    const definitionKind =
      officialKind[resource.type as keyof typeof officialKind];
    if (definitionKind) {
      const a = resource.attributes;
      const title = name.parse(a.name);
      const record = base(
        resource,
        definitionKind,
        title,
        definitionKind === "table"
          ? renderOfficialTable(a)
          : renderOfficialAttributes({ ...a, name: undefined }),
        { ...a },
      );
      record.fields.exchange = {
        format: "nexus",
        resource,
        ...(documentSource ? { documentSource } : {}),
      };
      if (typeof documentSource?.name === "string")
        record.sources = [{ book: documentSource.name.slice(0, 160) }];
      records.push(recordSchema.parse(record));
      continue;
    }
    if (!["monsters", "items", "encounters"].includes(resource.type)) continue;
    let record: ContentRecord;
    if (resource.type === "items") {
      const a = itemSchema.parse(resource.attributes);
      record = base(resource, "item", a.name, a.description, {
        kind: a.kind ?? "",
        rarity: a.rarity,
        moreInfo: a.moreInfo ?? "",
      });
    } else if (resource.type === "monsters") {
      // Nexus uses zero base HP for some explicitly per-hero statblocks.
      // Keep the original zero in source data; canonical HP is the scaled pool.
      const a = creatureSchema.parse({
        ...resource.attributes,
        ...(resource.attributes.hp === 0 &&
        typeof resource.attributes.hpPerHero === "number" &&
        resource.attributes.hpPerHero > 0
          ? { hp: undefined }
          : {}),
      });
      const missing: string[] = [];
      const familyBodies: string[] = [];
      const dependencies: Resource[] = [];
      for (const key of ["family", "families"]) {
        const rel = resource.relationships?.[key];
        if (!rel) continue;
        const value = links(rel);
        for (const link of Array.isArray(value)
          ? value
          : value
            ? [value]
            : []) {
          const family = resources.get(idFor(link));
          if (!family) {
            missing.push(`family ${link.id}`);
            continue;
          }
          const attr = z
            .looseObject({
              name,
              description: text.optional(),
              abilities: z.array(abilitySchema).max(500),
            })
            .parse(family.attributes);
          dependencies.push(family);
          familyBodies.push(
            `## ${attr.name}\n\n${attr.description ?? ""}\n\n${abilities(attr.abilities)}`,
          );
        }
      }
      // The encounter endpoint supplies mini-statblocks. HP alone is not a complete record.
      const complete =
        "abilities" in resource.attributes && "actions" in resource.attributes;
      if (!complete) missing.push("full statblock");
      const body = [
        a.description ?? a.moreInfo,
        ...familyBodies,
        abilities(a.abilities),
        "## Actions",
        a.actionsInstructions ?? a.actionPreface,
        actions(a.actions),
        ...(a.members ?? []).map(
          (m) =>
            `## ${m.name}\n\n${m.hpPerHero ? m.hpPerHero + " HP/hero" : m.hp + " HP"} · ${m.armor ?? "none"}\n\n${abilities(m.abilities)}\n\n${m.actionsInstructions ?? m.actionPreface ?? ""}\n\n${actions(m.actions)}`,
        ),
        a.bloodied ? `## Bloodied\n\n${phase(a.bloodied)}` : "",
        a.lastStand ? `## Last stand\n\n${phase(a.lastStand)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const level =
        a.level ??
        (a.levelInt !== undefined && a.levelInt < 0
          ? `1/${Math.abs(a.levelInt)}`
          : (a.levelInt ?? "—"));
      record = base(resource, "monster", a.name, body, {
        hp: a.hp,
        hpPerHero: a.hpPerHero ?? undefined,
        level: String(level),
        armor: a.hazard ? undefined : (a.armor ?? "none"),
        size: a.hazard ? undefined : (a.size ?? "medium"),
        kind: a.kind ?? "",
        hazard: a.hazard,
        legendary:
          !!a.legendary || ["legendary", "team"].includes(a.subtype ?? ""),
        minion: !!a.minion || a.subtype === "minion",
        bloodied: phase(a.bloodied),
        bloodiedAt: a.bloodiedAt,
        lastStand: phase(a.lastStand),
        lastStandHp: a.lastStandHp,
        lastStandHpPerHero: a.lastStandHpPerHero,
        saves: saves(a.saves),
        movement: (a.movement ?? [])
          .map((m) => `${m.mode ?? "walk"} ${m.speed}`)
          .join(" · "),
        ...(a.members?.length
          ? {
              members: a.members.map((m) => ({
                name: m.name,
                hp: m.hp,
                hpPerHero: m.hpPerHero ?? undefined,
                lastStandHp: m.lastStandHp,
                lastStandHpPerHero: m.lastStandHpPerHero,
                armor: m.armor ?? "none",
                size: m.size ?? "medium",
                saves: saves(m.saves),
                body: [
                  abilities(m.abilities),
                  m.actionsInstructions ?? m.actionPreface,
                  actions(m.actions),
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              })),
            }
          : {}),
        incomplete: missing.length > 0,
        missing,
        exchange: {
          format: "nexus",
          resource,
          dependencies,
          title: a.name,
          body,
        },
      });
      if (missing.length)
        warnings.push(
          `${a.name}: missing ${missing.join(", ")}. Import as a draft; combat is blocked.`,
        );
      // Mini creatures without HP are rejected; hazards legitimately have no HP.
    } else {
      const a = encounterSchema.parse(resource.attributes);
      const value = resource.relationships?.monsters
        ? links(resource.relationships.monsters)
        : undefined;
      if (!Array.isArray(value))
        throw new Error(`${a.name}: encounter is missing its monster entries.`);
      const entries = value.map((link, index) => {
        if (!link.meta)
          throw new Error(`${a.name}: missing quantity metadata.`);
        const target = targetFor(link.type, link.id);
        const full = resources.get(idFor(link));
        return {
          id: `entry-${index}`,
          target,
          name:
            typeof full?.attributes.name === "string"
              ? full.attributes.name
              : link.id,
          ...link.meta,
        };
      });
      record = base(resource, "encounter", a.name, a.description ?? "", {
        heroCount: a.heroCount,
        heroLevel: a.heroLevel,
        entries,
        annotations: "",
        missing: [],
        extensions: {},
        exchange: { format: "nexus", resource },
      });
    }
    if (!record.fields.exchange)
      record.fields.exchange = { format: "nexus", resource };
    // Preserve source identifiers and all unknown fields for lossless Slate backups.
    const extra = Object.keys(resource.attributes).filter(
      (k) =>
        ![
          "name",
          "description",
          "kind",
          "rarity",
          "moreInfo",
          "hp",
          "hpPerHero",
          "level",
          "levelInt",
          "armor",
          "size",
          "hazard",
          "legendary",
          "minion",
          "subtype",
          "members",
          "movement",
          "saves",
          "actions",
          "abilities",
          "actionsInstructions",
          "actionPreface",
          "bloodied",
          "lastStand",
          "heroCount",
          "heroLevel",
          "monsterCount",
          "createdAt",
        ].includes(k),
    );
    if (extra.length)
      warnings.push(
        `${record.title}: additional fields (${extra.join(", ")}) are retained in source data.`,
      );
    const external = JSON.stringify(resource).match(
      /https?:\/\/[^"\s]+\.(?:png|jpe?g|webp|svg)(?:\?[^"\s]*)?/gi,
    );
    if (external?.length)
      warnings.push(
        `${record.title}: external images remain source links; they are not downloaded or available offline.`,
      );
    if (documentSource) {
      (record.fields.exchange as Record<string, unknown>).documentSource =
        documentSource;
      if (typeof documentSource.name === "string")
        record.sources = [{ book: documentSource.name.slice(0, 160) }];
    }
    records.push(recordSchema.parse(record));
  }
  if (!records.length)
    throw new Error("No supported Nexus content records found.");
  // Convert reference-bearing prose after the whole document is validated.
  for (const record of records) {
    const convert = (body: string) =>
      body.replace(
        /@(monster|item):([a-zA-Z0-9_.-]+)/g,
        (_, type: string, id: string) => {
          const target = targetFor(type + "s", id);
          const found =
            records.find((r) => "local::" + r.id === target) ??
            all.find((e) => e.target === target);
          if (!found)
            warnings.push(
              record.title + ": unresolved " + type + " reference " + id + ".",
            );
          return referenceMarkdown(found?.title ?? type + ":" + id, target);
        },
      );
    record.body = convert(record.body);
    if (record.kind === "item" && typeof record.fields.moreInfo === "string")
      record.fields.moreInfo = convert(record.fields.moreInfo);
    if (record.kind === "monster") {
      const members = monsterStatsSchema.parse(record.fields).members;
      if (members)
        record.fields.members = members.map((member) => ({
          ...member,
          body: convert(member.body),
        }));
      (record.fields.exchange as { body: string }).body = record.body;
    }
  }
  return { records, warnings, format: "Nexus JSON:API" };
}

function importNimbrew(raw: unknown): ImportPreview {
  const passive = z.looseObject({
    type: z.literal("single"),
    name,
    desc: text,
  });
  const action = z.union([
    passive,
    z.looseObject({
      type: z.literal("multi"),
      name: text,
      desc: text.optional(),
      actions: z.array(passive).max(500),
    }),
  ]);
  const a = z
    .looseObject({
      name,
      CR: z.string().max(500),
      hp: z.string().max(500),
      armor: z.string().max(80),
      speed: z.string().max(240),
      saves: z.string().max(240).optional(),
      passives: z.array(passive).max(500),
      actions: z.array(action).max(500),
      bloodied: text.optional(),
      laststand: text.optional(),
    })
    .parse(raw);
  const hp = /^(\d+)(?:\s*\/hero)?$/.exec(a.hp.trim());
  const teamHp = hp
    ? []
    : a.hp.split(",").map((part) => {
        const match = /^\s*(.+?)\s+(\d+)(\/hero)?\s*$/.exec(part);
        if (!match)
          throw new Error(
            "Nimbrew HP is not a supported number or named team member list.",
          );
        return {
          name: match[1],
          hp: Number(match[2]),
          hpPerHero: match[3] ? Number(match[2]) : undefined,
        };
      });
  const actionBody = a.actions
    .map((group) =>
      group.type === "multi"
        ? `## ${group.name}\n\n${abilities(group.actions)}`
        : abilities([group]),
    )
    .join("\n\n");
  const body = [
    abilities(a.passives),
    "## Actions",
    actionBody,
    a.bloodied ? `## Bloodied\n\n${a.bloodied}` : "",
    a.laststand ? `## Last stand\n\n${a.laststand}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const armor =
    a.armor === "M" ? "medium" : a.armor === "H" ? "heavy" : a.armor || "none";
  const record = recordSchema.parse({
    id: uid(),
    kind: "monster",
    title: a.name,
    body,
    tags: [],
    category: "Nimbrew",
    sources: [],
    related: [],
    fields: {
      hp: hp ? Number(hp[1]) : undefined,
      hpPerHero: hp && a.hp.includes("/hero") ? Number(hp[1]) : undefined,
      level: /(?:Lvl|Level)\s+(\S+)/i.exec(a.CR)?.[1] ?? "—",
      kind: a.CR,
      armor,
      size: "medium",
      movement: a.speed,
      saves: a.saves ?? "",
      legendary: /\bSolo\b/i.test(a.CR) || !!teamHp.length,
      minion: /\bMinion\b/i.test(a.CR),
      ...(teamHp.length
        ? { members: teamHp.map((m) => ({ ...m, armor, body: actionBody })) }
        : {}),
      exchange: { format: "nimbrew", original: raw, title: a.name, body },
    },
  });
  return {
    records: [record],
    warnings: [
      "Nimbrew is a flattened format: damage text, creature kind, team ownership and source provenance may be ambiguous. Review the statblock before use.",
    ],
    format: "Nimbrew JSON",
  };
}

export function applyExchange(
  campaign: Campaign,
  incoming: ContentRecord[],
  mode: "skip" | "replace" | "copy",
): Campaign {
  const remap = new Map<string, string>();
  if (mode === "copy")
    for (const record of incoming) remap.set(record.id, uid());
  const targetRemap = (target: string) => {
    const [base, anchor] = target.split("#");
    return base.startsWith("local::") && remap.has(base.slice(7))
      ? "local::" + remap.get(base.slice(7)) + (anchor ? "#" + anchor : "")
      : target;
  };
  let content = [...campaign.content];
  for (const record of incoming) {
    let copy = structuredClone(record);
    if (mode === "copy") {
      copy.id = remap.get(record.id)!;
      copy.body = copy.body.replace(
        /slate:([^\s)]+)/g,
        (whole, token: string) => {
          try {
            const target = decodeURIComponent(token);
            return "slate:" + encodeURIComponent(targetRemap(target));
          } catch {
            return whole;
          }
        },
      );
      copy.related = copy.related.map(targetRemap);
      if (copy.kind === "item" && typeof copy.fields.moreInfo === "string")
        copy.fields.moreInfo = copy.fields.moreInfo.replace(
          /slate:([^\s)]+)/g,
          (whole, token: string) => {
            try {
              return (
                "slate:" +
                encodeURIComponent(targetRemap(decodeURIComponent(token)))
              );
            } catch {
              return whole;
            }
          },
        );
      if (copy.kind === "encounter") {
        const fields = encounterFieldsSchema.parse(copy.fields);
        copy.fields = {
          ...copy.fields,
          ...fields,
          entries: fields.entries.map((e) => ({
            ...e,
            target: targetRemap(e.target),
          })),
        };
      }
      if (copy.kind === "table")
        copy = remapTableContent(
          copy,
          targetRemap,
          (id) => remap.get(id) ?? id,
        );
    }
    const exists = content.some((r) => r.id === copy.id);
    if (exists && mode === "skip") continue;
    content = exists
      ? content.map((r) => (r.id === copy.id ? copy : r))
      : [...content, copy];
  }
  return campaignSchema.parse({ ...campaign, content });
}

export function exportRecords(
  records: ContentRecord[],
  format: "slate" | "pack" | "nexus" | "nimbrew",
  all: Entry[] = [],
  packName = "Custom content",
) {
  records = records.map((record) => recordSchema.parse(record));
  if (format === "pack") {
    const identity = { id: "slate-" + uid(), version: "1" };
    const warnings: string[] = [];
    const mapTarget = (target: string) => {
      const [base, anchor] = target.split("#");
      const record = records.find((record) => `local::${record.id}` === base);
      if (!record) return target;
      return packTarget(identity, record.id) + (anchor ? "#" + anchor : "");
    };
    const mapBody = (body: string) =>
      body.replace(/slate:([^\s)]+)/g, (whole, encoded: string) => {
        try {
          return referenceHref(mapTarget(decodeURIComponent(encoded)));
        } catch {
          return whole;
        }
      });
    const portable = records.map((record) => {
      const definition = tableDefinition(record);
      if (definition)
        for (const row of definition.rows)
          if (
            row.tableId?.startsWith("local::") &&
            !records.some((record) => `local::${record.id}` === row.tableId)
          )
            warnings.push(
              `${record.title}: a linked table is not selected for export.`,
            );
      return {
        ...record,
        body: mapBody(record.body),
        related: record.related.map(mapTarget),
        ...(record.kind === "item" && typeof record.fields.moreInfo === "string"
          ? {
              fields: {
                ...record.fields,
                moreInfo: mapBody(record.fields.moreInfo),
              },
            }
          : {}),
        ...(record.kind === "encounter"
          ? {
              fields: {
                ...record.fields,
                entries: encounterFieldsSchema
                  .parse(record.fields)
                  .entries.map((entry) => ({
                    ...entry,
                    target: mapTarget(entry.target),
                  })),
              },
            }
          : {}),
        ...(definition
          ? {
              fields: {
                ...record.fields,
                definition: {
                  ...mapTableLinks(definition, mapTarget),
                  rows: mapTableLinks(definition, mapTarget).rows.map(
                    (row) => ({ ...row, body: mapBody(row.body) }),
                  ),
                },
              },
            }
          : {}),
      };
    });
    return {
      value: packSchema.parse({
        format: "slate-content",
        schemaVersion: 1,
        ...identity,
        name: packName,
        source: {
          revision: "1",
          license: "Campaign-created content.",
        },
        records: portable,
        terms: [],
        assets: {},
      }),
      warnings,
    };
  }
  if (format === "slate") {
    const warnings: string[] = [];
    for (const record of records.filter((r) => r.kind === "encounter")) {
      const fields = encounterFieldsSchema.parse(record.fields);
      for (const target of new Set(fields.entries.map((e) => e.target))) {
        const selected = records.find(
          (r) => `local::${r.id}` === target && r.kind === "monster",
        );
        if (!selected) {
          const name = all.find((r) => r.target === target)?.title ?? target;
          warnings.push(
            `${record.title}: ${name} is referenced but not included. Export its full record or use a campaign ZIP with the matching packs.`,
          );
        } else if (selected.fields.incomplete) {
          warnings.push(
            `${record.title}: ${selected.title} is an incomplete statblock. Include its full family dependencies before starting combat.`,
          );
        }
      }
    }
    return {
      value: { format: "slate-records", schemaVersion: 1, records },
      warnings,
    };
  }
  const warnings: string[] = [];
  const included = new Map<string, Resource>();
  if (format === "nexus" && records.some((record) => tableDefinition(record)))
    throw new Error(
      "Nexus reference tables do not encode Slate roll mappings. Export random tables as Slate records or a Slate content pack.",
    );
  if (format === "nimbrew") {
    if (records.length !== 1 || records[0].kind !== "monster")
      throw new Error("Nimbrew export supports one monster at a time.");
    const record = records[0],
      stats = monsterStatsSchema.parse(record.fields);
    const exchange = record.fields.exchange as
      | { format?: string; original?: unknown; body?: string; title?: string }
      | undefined;
    if (
      exchange?.format === "nimbrew" &&
      exchange.body === record.body &&
      exchange.title === record.title &&
      JSON.stringify(record.fields) ===
        JSON.stringify(importNimbrew(exchange.original).records[0].fields)
    )
      return { value: exchange.original, warnings };
    if (stats.hazard)
      throw new Error(
        "Nimbrew cannot reliably represent a hazard without creature HP.",
      );
    warnings.push(
      `${record.title}: structured actions and family identity become Markdown in one passive; source metadata, Slate references and custom fields are omitted.`,
    );
    return {
      value: {
        name: record.title,
        CR: `Level ${stats.level}${stats.legendary ? " Solo" : stats.minion ? " Minion" : ""} ${stats.kind}`,
        hp: stats.members
          ? stats.members
              .map(
                (m) =>
                  `${m.name} ${m.hpPerHero ? m.hpPerHero + "/hero" : m.hp}`,
              )
              .join(", ")
          : String(stats.hpPerHero ? stats.hpPerHero + "/hero" : stats.hp),
        armor:
          stats.armor === "heavy" ? "H" : stats.armor === "medium" ? "M" : "",
        speed: stats.movement,
        saves: stats.saves,
        passives: [
          {
            type: "single",
            name: "Statblock",
            desc: record.body.replace(/\[([^\]]+)\]\(slate:[^\s)]+\)/g, "$1"),
          },
        ],
        actions: [],
        theme: {
          BGColor: "#f2ebda",
          BGOpacity: "1",
          passiveBGColor: "#d8d2c2",
          textColor: "#000000",
          accentColor: "#555555",
          borderOpacity: "1",
        },
      },
      warnings,
    };
  }
  const exportId = (record: ContentRecord) => {
    const resource = (
      record.fields.exchange as { resource?: Resource } | undefined
    )?.resource;
    return resource && record.id === idFor(resource)
      ? resource.id
      : record.id.replace(/[^a-zA-Z0-9_.-]/g, "-");
  };
  const nexusProse = (body: string, owner: ContentRecord) =>
    body.replace(
      /\[([^\]]+)\]\(slate:([^\s)]+)\)/g,
      (whole, label: string, encoded: string) => {
        let target: string;
        try {
          target = decodeURIComponent(encoded);
        } catch {
          return whole;
        }
        const [base, anchor] = target.split("#");
        const referenced =
          records.find((r) => "local::" + r.id === base) ??
          all.find((r) => r.target === base);
        if (referenced && ["monster", "item"].includes(referenced.kind)) {
          if (anchor)
            warnings.push(
              owner.title + ": reference section anchor is omitted by Nexus.",
            );
          return (
            "@" + referenced.kind + ":" + exportId(referenced as ContentRecord)
          );
        }
        warnings.push(
          owner.title +
            ": reference to " +
            label +
            " has no Nexus target; its readable label is retained.",
        );
        return label;
      },
    );
  const data = records.map((record) => {
    const exchange = record.fields.exchange as
      | {
          resource?: Resource;
          dependencies?: Resource[];
          body?: string;
          title?: string;
        }
      | undefined;
    const original = exchange?.resource;
    for (const resource of exchange?.dependencies ?? [])
      included.set(idFor(resource), resource);
    let attributes: Record<string, unknown>;
    if (record.kind === "item") {
      const f = itemFieldsSchema.parse(record.fields);
      attributes = {
        ...original?.attributes,
        name: record.title,
        kind: f.kind,
        rarity: f.rarity,
        description: nexusProse(record.body, record),
        moreInfo: nexusProse(f.moreInfo, record),
      };
      for (const key of [
        "price",
        "slots",
        "damage",
        "armor",
        "uses",
        "properties",
      ])
        if (
          key === "properties"
            ? Object.keys(f.properties).length
            : f[key as keyof typeof f] !== undefined
        )
          warnings.push(
            `${record.title}: ${key} has no Nexus item field and is omitted.`,
          );
    } else if (record.kind === "monster") {
      const f = monsterStatsSchema.parse(record.fields);
      const unchanged = original && exchange?.body === record.body;
      const level = /^\d+$/.test(f.level) ? Number(f.level) : f.level;
      attributes = unchanged
        ? {
            ...original.attributes,
            name: record.title,
            ...(f.hazard
              ? {}
              : { hp: f.hp, hpPerHero: f.hpPerHero, armor: f.armor }),
            level,
          }
        : {
            name: record.title,
            hazard: !!f.hazard,
            hp: f.hp,
            hpPerHero: f.hpPerHero,
            level,
            armor: f.armor,
            size: f.size,
            kind: f.kind,
            legendary: f.legendary,
            minion: f.minion,
            subtype: f.members
              ? "team"
              : f.legendary
                ? "legendary"
                : f.minion
                  ? "minion"
                  : "standard",
            description: nexusProse(record.body, record),
            abilities: [],
            actions: [],
            actionsInstructions: "",
            ...(f.members
              ? {
                  members: f.members.map((m) => ({
                    ...m,
                    description: m.body,
                    abilities: [],
                    actions: [],
                  })),
                }
              : {}),
          };
      if (!unchanged)
        warnings.push(
          `${record.title}: Markdown is exported as description; structured actions, phases, movement and saves cannot be reconstructed. Use Slate export for complete data.`,
        );
    } else if (record.kind === "encounter") {
      const f = encounterFieldsSchema.parse(record.fields);
      attributes = {
        ...original?.attributes,
        name: record.title,
        description: nexusProse(record.body, record),
        heroCount: f.heroCount,
        heroLevel: f.heroLevel,
      };
      if (f.annotations)
        warnings.push(`${record.title}: campaign annotations are omitted.`);
      warnings.push(
        `${record.title}: export retains source monster identifiers; include full monster documents for offline use.`,
      );
      return {
        type: "encounters",
        id: exportId(record),
        attributes,
        relationships: {
          monsters: {
            data: f.entries.map((e) => ({
              type: "monsters",
              id: (() => {
                const referenced =
                  records.find((r) => "local::" + r.id === e.target) ??
                  all.find((r) => r.target === e.target);
                if (referenced && referenced.kind === "monster")
                  return exportId(referenced as ContentRecord);
                return e.target.startsWith("local::nexus/monsters/")
                  ? e.target.slice("local::nexus/monsters/".length)
                  : e.target
                      .replace(/^local::/, "")
                      .replace(/[^a-zA-Z0-9_.-]/g, "-");
              })(),
              meta: {
                quantity: e.quantity,
                isPerHero: e.isPerHero,
                heroesPerMonster: e.heroesPerMonster,
              },
            })),
          },
        },
      };
    } else if (
      Object.values(officialKind).includes(
        record.kind as (typeof officialKind)[keyof typeof officialKind],
      )
    ) {
      const type = Object.entries(officialKind).find(
        ([, kind]) => kind === record.kind,
      )![0];
      const fields = Object.fromEntries(
        Object.entries(record.fields).filter(
          ([key]) => key !== "exchange" && key !== "upstream",
        ),
      );
      attributes = { ...original?.attributes, ...fields, name: record.title };
      if (typeof attributes.description !== "string")
        attributes.description = nexusProse(record.body, record);
      warnings.push(
        `${record.title}: structured definition fields are retained; Markdown edits and Slate metadata require Slate export.`,
      );
      return { ...(original ?? {}), type, id: exportId(record), attributes };
    } else
      throw new Error(
        "Nexus exchange supports items, monsters and encounters.",
      );
    warnings.push(
      `${record.title}: Slate tags, category, related links and campaign identity are omitted; source data stays in backups.`,
    );
    return {
      ...(original ?? {}),
      type: record.kind + "s",
      id: exportId(record),
      attributes,
      ...(record.kind === "monster" && exchange?.body !== record.body
        ? { relationships: undefined }
        : {}),
    };
  });
  if (new Set(data.map((r) => r.type + "/" + r.id)).size !== data.length)
    throw new Error(
      "Two selected records share a Nexus source ID. Export them separately or use Slate records.",
    );
  return { value: { data, included: [...included.values()] }, warnings };
}
