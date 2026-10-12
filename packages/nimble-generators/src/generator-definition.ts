import { z } from "zod";
import {
  NameGenerator,
  choose,
  type NameGender,
  type RandomSource,
} from "./name-generator.js";
import { npcAttributeKinds } from "./attributes.js";

const fragment = z.string().trim().min(1).max(39);
const fragments = z.array(fragment).max(500);
export const namePatternsSchema = z
  .strictObject({
    syllables: z.strictObject({
      prefixes: fragments,
      middle: fragments,
      suffixes: fragments,
    }),
    patterns: z
      .array(z.string().regex(/^[PMS]{1,8}$/))
      .min(1)
      .max(30),
    constraints: z.strictObject({
      minLength: z.number().int().min(1).max(39),
      maxLength: z.number().int().min(1).max(39),
      syllableCount: z.strictObject({
        min: z.number().int().min(1).max(8),
        max: z.number().int().min(1).max(8),
      }),
    }),
  })
  .superRefine((table, ctx) => {
    const { minLength, maxLength, syllableCount } = table.constraints;
    if (minLength > maxLength || syllableCount.min > syllableCount.max) {
      ctx.addIssue({
        code: "custom",
        message: "Minimum constraints cannot exceed maximum constraints.",
      });
      return;
    }
    const pools = {
      P: table.syllables.prefixes,
      M: table.syllables.middle,
      S: table.syllables.suffixes,
    };
    for (const pattern of table.patterns) {
      // String refinements can fail without aborting Zod object refinements.
      if (!/^[PMS]{1,8}$/.test(pattern)) continue;
      let lengths = new Set([0]);
      for (const part of pattern) {
        const sizes = new Set(
          pools[part as keyof typeof pools].map((s) => s.length),
        );
        lengths = new Set(
          [...lengths]
            .flatMap((length) => [...sizes].map((size) => length + size))
            .filter((length) => length <= maxLength),
        );
      }
      if (
        pattern.length < syllableCount.min ||
        pattern.length > syllableCount.max ||
        ![...lengths].some((length) => length >= minLength)
      )
        ctx.addIssue({
          code: "custom",
          path: ["patterns"],
          message: `Pattern ${pattern} cannot produce a name within its constraints. Check its fragments and lengths.`,
        });
    }
  });
export const nameConfigSchema = z
  .strictObject({
    unisex: namePatternsSchema.optional(),
    male: namePatternsSchema.optional(),
    female: namePatternsSchema.optional(),
    surnames: namePatternsSchema.optional(),
  })
  .refine(
    (config) => !!(config.unisex || config.male || config.female),
    "Add at least one first-name pool.",
  );
const names = z.array(z.string().trim().min(1).max(39)).max(2000);
const listNamesSchema = z
  .strictObject({
    mode: z.literal("list"),
    firstNames: z.strictObject({ any: names, male: names, female: names }),
    surnames: names,
  })
  .refine(
    (table) => Object.values(table.firstNames).some((pool) => pool.length),
    "Add at least one first name.",
  );
export const generatorDefinitionSchema = z.strictObject({
  names: z.discriminatedUnion("mode", [
    listNamesSchema,
    z.strictObject({ mode: z.literal("syllables"), config: nameConfigSchema }),
  ]),
  attributes: z.strictObject(
    Object.fromEntries(
      npcAttributeKinds.map((kind) => [
        kind,
        z.array(z.string().trim().min(1).max(500)).min(1).max(2000),
      ]),
    ) as Record<(typeof npcAttributeKinds)[number], z.ZodArray<z.ZodString>>,
  ),
});
export type GeneratorDefinition = z.infer<typeof generatorDefinitionSchema>;
export function generateDefinedName(
  definition: GeneratorDefinition,
  gender?: NameGender,
  random: RandomSource = Math.random,
): string {
  const table = definition.names;
  if (table.mode === "syllables")
    return NameGenerator.generateFullName(table.config, gender, random);
  const requested = gender ? table.firstNames[gender] : [];
  const pool = table.firstNames.any.length
    ? table.firstNames.any
    : requested.length
      ? requested
      : [...table.firstNames.male, ...table.firstNames.female];
  const first = choose(pool, random);
  return table.surnames.length
    ? `${first} ${choose(table.surnames, random)}`
    : first;
}
