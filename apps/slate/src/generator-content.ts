import {
  generatorDefinitionSchema,
  nameStyles,
  npcAttributeTables,
  type GeneratorDefinition,
} from "@nimble/generators";
import { packSchema, type ContentRecord } from "./content-schema";
import type { Campaign } from "./model";

export function builtinDefinition(id = "generic"): GeneratorDefinition {
  const style = nameStyles.find((style) => style.id === id);
  if (!style) throw new Error("Unknown built-in generator.");
  return generatorDefinitionSchema.parse({
    names: { mode: "syllables", config: style.config },
    attributes: npcAttributeTables,
  });
}
export function blankDefinition(): GeneratorDefinition {
  return {
    names: {
      mode: "list",
      firstNames: { any: ["Rowan"], male: [], female: [] },
      surnames: [],
    },
    attributes: {
      appearance: ["A weathered travelling cloak."],
      scar: ["A small scar across one eyebrow."],
      mannerism: ["Pauses to choose their words."],
      quirk: ["Collects unusual coins."],
    },
  };
}
export function generatorRecord(
  id: string,
  title: string,
  definition: GeneratorDefinition,
  original?: ContentRecord,
): ContentRecord {
  return {
    id,
    kind: "npc-generator",
    title,
    body: original?.body ?? "Name and attribute tables for the NPC generator.",
    tags: original?.tags ?? ["npc", "generator"],
    category: original?.category ?? "NPC generators",
    sources: original?.sources ?? [],
    related: original?.related ?? [],
    ...(original?.origin ? { origin: original.origin } : {}),
    ...(original?.importedFrom ? { importedFrom: original.importedFrom } : {}),
    fields: generatorDefinitionSchema.parse(definition),
  };
}
export function exportGeneratorPack(
  campaign: Campaign,
  id: string,
  version: string,
  name: string,
) {
  const records = campaign.content.filter(
    (record) => record.kind === "npc-generator",
  );
  if (!records.length)
    throw new Error("Create a campaign generator before exporting a pack.");
  // Packs are self-contained. References to unrelated campaign records stay in
  // campaign backups, rather than producing invalid portable pack dependencies.
  return packSchema.parse({
    format: "slate-content",
    schemaVersion: 1,
    id,
    version,
    name,
    source: {
      revision: version,
      license: "User-created campaign generator tables.",
    },
    records: records.map((record) => ({ ...record, related: [] })),
    terms: [],
    assets: {},
  });
}
