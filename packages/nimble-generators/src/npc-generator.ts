import { z } from "zod";
import { NameGenerator, type RandomSource } from "./name-generator.js";
import {
  generatorDefinitionSchema,
  generateDefinedName,
  type GeneratorDefinition,
} from "./generator-definition.js";
import { nameStyles } from "./name-tables.js";
import {
  generateNpcAttributes,
  generateNpcAttribute,
  npcAttributeTables,
  npcAttributeKinds,
  npcAttributeLabels,
  type NpcAttributeKind,
} from "./attributes.js";

export const nameStyleSchema = z.enum([
  "generic",
  "human",
  "elf",
  "dwarf",
  "halfling",
  "gnome",
]);
export const npcOptionsSchema = z.object({
  style: z.string().min(1).max(500).default("generic"),
  gender: z.enum(["any", "male", "female"]).default("any"),
});
export type NpcOptions = z.infer<typeof npcOptionsSchema>;
export const generatedNpcSchema = z.object({
  name: z.string().trim().min(1).max(80),
  style: npcOptionsSchema.shape.style,
  generator: generatorDefinitionSchema.optional(),
  gender: npcOptionsSchema.shape.gender,
  attributes: z.object({
    appearance: z.string().trim().min(1).max(500),
    scar: z.string().trim().min(1).max(500),
    mannerism: z.string().trim().min(1).max(500),
    quirk: z.string().trim().min(1).max(500),
  }),
});
export type GeneratedNpc = z.infer<typeof generatedNpcSchema>;

function nameFor(
  options: NpcOptions,
  random: RandomSource,
  definition?: GeneratorDefinition,
): string {
  if (definition)
    return generateDefinedName(
      definition,
      options.gender === "any" ? undefined : options.gender,
      random,
    );
  const style = nameStyles.find((style) => style.id === options.style);
  if (!style)
    throw new Error(
      "This generator is unavailable. Enable its content pack or choose another name style.",
    );
  const config = style.config;
  return NameGenerator.generateFullName(
    config,
    options.gender === "any" ? undefined : options.gender,
    random,
  );
}
export function generateNpc(
  options: Partial<NpcOptions> = {},
  random: RandomSource = Math.random,
  definition?: GeneratorDefinition,
): GeneratedNpc {
  const settings = npcOptionsSchema.parse(options);
  const tables = definition
    ? generatorDefinitionSchema.parse(definition)
    : undefined;
  return {
    ...settings,
    ...(tables ? { generator: tables } : {}),
    name: nameFor(settings, random, tables),
    attributes: generateNpcAttributes(
      random,
      tables?.attributes ?? npcAttributeTables,
    ),
  };
}
export function rerollNpcName(
  npc: GeneratedNpc,
  random: RandomSource = Math.random,
): GeneratedNpc {
  return {
    ...npc,
    name: nameFor(npcOptionsSchema.parse(npc), random, npc.generator),
  };
}
export function rerollNpcAttribute(
  npc: GeneratedNpc,
  kind: NpcAttributeKind,
  random: RandomSource = Math.random,
): GeneratedNpc {
  return {
    ...npc,
    attributes: {
      ...npc.attributes,
      [kind]: generateNpcAttribute(
        kind,
        random,
        npc.generator?.attributes ?? npcAttributeTables,
      ),
    },
  };
}
export function generateNpcs(
  count: number,
  options: Partial<NpcOptions> = {},
  random: RandomSource = Math.random,
  definition?: GeneratorDefinition,
): GeneratedNpc[] {
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw new Error("Generate between 1 and 100 NPCs at a time.");
  return Array.from({ length: count }, () =>
    generateNpc(options, random, definition),
  );
}
export function formatNpc(npc: GeneratedNpc): string {
  return [
    npc.name,
    ...npcAttributeKinds.map(
      (kind) => `${npcAttributeLabels[kind]}: ${npc.attributes[kind]}`,
    ),
  ].join("\n");
}
