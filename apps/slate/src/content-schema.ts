import { z } from "zod";
import { mapDocumentTargets } from "./document-markdown";
export { referenceHref, referenceMarkdown, readTarget } from "./references";
import { generatorDefinitionSchema } from "@nimble/generators";
import { itemFieldsSchema } from "./item-schema";
import { encounterFieldsSchema } from "./encounter-schema";
import {
  monsterStatsSchema,
  referenceMonsterFieldsSchema,
} from "./monster-schema";
import { tableDefinitionSchema } from "./utility-schema";

const key = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_./-]+$/);
const contentSourceSchema = z.object({
  url: z
    .url()
    .refine((url) => /^https?:\/\//i.test(url), "Source must be an HTTP(S) URL")
    .optional(),
  revision: z.string().max(100),
  license: z.string().max(500),
});
const contentAssetsSchema = z.record(
  z.string(),
  z
    .string()
    .max(1500000)
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
);
export const recordSchema = z
  .object({
    // Legacy note tools allowed arbitrary nonempty IDs; preserve their links.
    id: z.string().min(1),
    kind: z.enum([
      "note",
      "rule",
      "spell",
      "item",
      "faq",
      "monster",
      "npc-generator",
      "encounter",
      "class",
      "subclass",
      "ancestry",
      "background",
      "table",
    ]),
    title: z.string().trim().min(1).max(160),
    body: z.string().max(100000),
    tags: z.array(z.string().max(100)).max(80),
    category: z.string().max(160).default(""),
    sources: z
      .array(
        z.object({
          book: z.string().max(160),
          pages: z.array(z.number().int().positive()).optional(),
        }),
      )
      .max(20)
      .default([]),
    related: z.array(z.string().max(500)).max(100).default([]),
    fields: z.record(z.string(), z.unknown()).default({}),
    origin: z.string().max(500).optional(),
    importedFrom: z
      .object({
        name: z.string().min(1).max(160),
        source: contentSourceSchema,
        assets: contentAssetsSchema.refine(
          (assets) => Object.keys(assets).length <= 100,
          "Too many imported images",
        ),
      })
      .optional(),
  })
  .superRefine((record, ctx) => {
    if (record.kind !== "note" && !key.safeParse(record.id).success)
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: "Invalid content ID",
      });
    if (
      !["monster", "npc-generator", "item", "encounter", "table"].includes(
        record.kind,
      )
    )
      return;
    // Older official tables contain Markdown only; retain those reference tables.
    if (record.kind === "table" && record.fields.definition === undefined)
      return;
    const parsed =
      record.kind === "table"
        ? tableDefinitionSchema.safeParse(record.fields.definition)
        : record.kind === "monster"
          ? (record.fields.referenceOnly === true
              ? referenceMonsterFieldsSchema
              : monsterStatsSchema
            ).safeParse(record.fields)
          : record.kind === "item"
            ? itemFieldsSchema.safeParse(record.fields)
            : record.kind === "encounter"
              ? encounterFieldsSchema.safeParse(record.fields)
              : generatorDefinitionSchema.safeParse(record.fields);
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        ctx.addIssue({
          code: "custom",
          path: ["fields", ...issue.path],
          message: issue.message,
        });
  });
export type ContentRecord = z.infer<typeof recordSchema>;
export const packSchema = z
  .strictObject({
    format: z.literal("slate-content"),
    schemaVersion: z.literal(1),
    id: key,
    version: key,
    name: z.string().min(1).max(160),
    system: key.optional(),
    referenceOnly: z.boolean().optional(),
    source: contentSourceSchema,
    records: z.array(recordSchema).min(1).max(3000),
    terms: z
      .array(
        z.object({
          term: z.string().max(160),
          aliases: z.array(z.string().max(160)),
          target: z.string().max(500),
          preview: z.string().max(3000),
        }),
      )
      .max(2000),
    assets: contentAssetsSchema,
  })
  .superRefine((p, ctx) => {
    if (new Set(p.records.map((r) => r.id)).size !== p.records.length)
      ctx.addIssue({ code: "custom", message: "Duplicate content IDs" });
    if (Object.keys(p.assets).length > 100)
      ctx.addIssue({ code: "custom", message: "Too many pack images" });
    for (const term of p.terms)
      if (!p.records.some((r) => r.id === term.target.split("#")[0]))
        ctx.addIssue({
          code: "custom",
          message: `Missing term target: ${term.term}`,
        });
    for (const r of p.records)
      for (const link of r.related)
        if (
          !/^[a-zA-Z0-9_./-]+@[a-zA-Z0-9_./-]+::[a-zA-Z0-9_./-]+(?:#[a-zA-Z0-9_-]+)?$/.test(
            link,
          ) &&
          !p.records.some((t) => t.id === link.split("#")[0])
        )
          ctx.addIssue({
            code: "custom",
            message: `Missing related record: ${link}`,
          });
  });
export type ContentPack = z.infer<typeof packSchema>;
export const packKey = (pack: Pick<ContentPack, "id" | "version">) =>
  `${pack.id}@${pack.version}`;
export const packTarget = (
  pack: Pick<ContentPack, "id" | "version">,
  id: string,
) => `${packKey(pack)}::${id}`;
export function remapReferences(body: string, remap: (id: string) => string) {
  return mapDocumentTargets(body, (target) => {
    if (!target.startsWith("local::")) return target;
    const [id, anchor] = target.slice(7).split("#");
    return `local::${remap(id)}${anchor ? "#" + anchor : ""}`;
  });
}
export function mergePacks(existing: ContentPack[], incoming: ContentPack[]) {
  const merged = [...existing];
  for (const pack of incoming) {
    const old = merged.find((p) => packKey(p) === packKey(pack));
    if (old && JSON.stringify(old) !== JSON.stringify(pack))
      throw new Error(
        "This pack version already exists with different content. Use a new version.",
      );
    if (!old) merged.push(pack);
  }
  return merged;
}
export function parsePack(text: string): ContentPack {
  if (new TextEncoder().encode(text).length > 8 * 1024 * 1024)
    throw new Error("Content pack exceeds 8 MiB.");
  return packSchema.parse(JSON.parse(text));
}
