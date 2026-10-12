import { expect, it } from "vitest";
import {
  generatorDefinitionSchema,
  generateNpc,
  generateNpcs,
  rerollNpcName,
  rerollNpcAttribute,
  nameStyles,
  npcAttributeTables,
  type GeneratorDefinition,
} from "./index.js";

const definition = (): GeneratorDefinition => ({
  names: {
    mode: "list",
    firstNames: { any: [], male: ["Merrin"], female: ["LYRA", "Sable"] },
    surnames: ["Ash Vale"],
  },
  attributes: {
    appearance: ["Velvet cloak"],
    scar: ["Nicked ear"],
    mannerism: ["Whistles"],
    quirk: ["Collects spoons", "Counts clouds"],
  },
});
it("generates complete NPCs from custom lists with gender fallback, preserved case and independent rerolls", () => {
  const tables = definition();
  const npc = generateNpc(
    { style: "custom::people", gender: "female" },
    () => 0,
    tables,
  );
  expect(npc.name).toBe("LYRA Ash Vale");
  expect(npc.attributes.quirk).toBe("Collects spoons");
  expect(rerollNpcName(npc, () => 0.99).name).toBe("Sable Ash Vale");
  expect(rerollNpcAttribute(npc, "quirk", () => 0.99).attributes.quirk).toBe(
    "Counts clouds",
  );
  tables.names = {
    mode: "list",
    firstNames: { any: ["Any"], male: ["Masculine"], female: ["Feminine"] },
    surnames: [],
  };
  expect(generateNpc({ gender: "male" }, () => 0, tables).name).toBe("Any");
  tables.names.firstNames = { any: [], male: [], female: ["Fallback"] };
  expect(generateNpc({ gender: "male" }, () => 0, tables).name).toBe(
    "Fallback",
  );
  expect(generateNpcs(5, {}, () => 0, tables)).toHaveLength(5);
  expect(npc.generator!.names).not.toEqual(tables.names);
});
it("rejects empty names, missing traits, oversized entries and malformed patterns before generation", () => {
  const empty = definition();
  if (empty.names.mode !== "list") throw new Error("Expected lists");
  empty.names.firstNames = { any: [], male: [], female: [] };
  expect(generatorDefinitionSchema.safeParse(empty).success).toBe(false);
  const tables = definition();
  tables.attributes.quirk = [];
  expect(() => generateNpc({}, () => 0, tables)).toThrow();
  tables.attributes.quirk = ["a".repeat(501)];
  expect(generatorDefinitionSchema.safeParse(tables).success).toBe(false);
  for (const pattern of ["X", "", "P".repeat(9)]) {
    const patterns = {
      names: {
        mode: "syllables",
        config: {
          unisex: {
            syllables: { prefixes: ["al"], middle: [], suffixes: ["ra"] },
            patterns: [pattern],
            constraints: {
              minLength: 1,
              maxLength: 8,
              syllableCount: { min: 1, max: 8 },
            },
          },
        },
      },
      attributes: definition().attributes,
    };
    expect(generatorDefinitionSchema.safeParse(patterns).success).toBe(false);
  }
});
it("validates every built-in table and rejects impossible lengths or empty fragments in custom patterns", () => {
  for (const style of nameStyles)
    expect(
      generatorDefinitionSchema.safeParse({
        names: { mode: "syllables", config: style.config },
        attributes: npcAttributeTables,
      }).success,
    ).toBe(true);
  const tables = {
    names: {
      mode: "syllables",
      config: {
        unisex: {
          syllables: { prefixes: ["al"], middle: [], suffixes: ["ra"] },
          patterns: ["PS"],
          constraints: {
            minLength: 4,
            maxLength: 4,
            syllableCount: { min: 2, max: 2 },
          },
        },
      },
    },
    attributes: definition().attributes,
  };
  expect(
    generateNpc({}, () => 0, generatorDefinitionSchema.parse(tables)).name,
  ).toBe("Alra");
  tables.names.config.unisex.constraints.maxLength = 3;
  expect(generatorDefinitionSchema.safeParse(tables).success).toBe(false);
  tables.names.config.unisex.constraints.maxLength = 4;
  tables.names.config.unisex.syllables.suffixes = [];
  expect(generatorDefinitionSchema.safeParse(tables).success).toBe(false);
});

it("finds a valid pattern fallback in heavily weighted custom tables without exponential traversal", () => {
  const tables = generatorDefinitionSchema.parse({
    names: {
      mode: "syllables",
      config: {
        unisex: {
          syllables: {
            prefixes: ["a", "al"],
            middle: Array(500).fill("b"),
            suffixes: [...Array(499).fill("dddd"), "c"],
          },
          patterns: ["PMS"],
          constraints: {
            minLength: 4,
            maxLength: 4,
            syllableCount: { min: 3, max: 3 },
          },
        },
      },
    },
    attributes: definition().attributes,
  });
  expect(generateNpc({}, () => 0, tables).name).toBe("Albc");
  if (tables.names.mode !== "syllables") throw new Error("Expected patterns");
  tables.names.config.unisex!.syllables = {
    prefixes: Array.from({ length: 38 }, (_, i) => "a".repeat(i + 1)),
    middle: [],
    suffixes: Array(500).fill("b"),
  };
  tables.names.config.unisex!.patterns = ["PS"];
  tables.names.config.unisex!.constraints = {
    minLength: 39,
    maxLength: 39,
    syllableCount: { min: 2, max: 2 },
  };
  expect(generateNpc({}, () => 0, tables).name).toBe(
    "A" + "a".repeat(37) + "b",
  );
});
