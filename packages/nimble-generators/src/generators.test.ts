import { describe, expect, it } from "vitest";
import {
  NameGenerator,
  generateNpc,
  generateNpcs,
  generatedNpcSchema,
  nameStyles,
  npcAttributeKinds,
  npcAttributeTables,
  generateNpcAttributes,
  rerollNpcAttribute,
  rerollNpcName,
  type NameConfig,
} from "./index.js";

const simple: NameConfig = {
  unisex: {
    syllables: { prefixes: ["al"], middle: [], suffixes: ["ra"] },
    patterns: ["PS"],
    constraints: {
      minLength: 4,
      maxLength: 4,
      syllableCount: { min: 2, max: 2 },
    },
  },
};
function seeded(seed = 1) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
describe("shared Sidekick name generator", () => {
  it("preserves the public API, unisex precedence and optional surnames", () => {
    expect(NameGenerator.generateFirstName(simple, "male", () => 0)).toBe(
      "Alra",
    );
    expect(NameGenerator.generateFullName(simple, undefined, () => 0)).toBe(
      "Alra",
    );
    expect(
      NameGenerator.generateSurname(
        { ...simple, surnames: simple.unisex },
        () => 0,
      ),
    ).toBe("Alra");
    expect(() => NameGenerator.generateSurname(simple)).toThrow("surname");
    expect(() => NameGenerator.generateFirstName({})).toThrow("configuration");
  });
  it("does not emit an invalid name when a fixed random source keeps selecting a long fragment", () => {
    const table = structuredClone(simple.unisex!);
    table.syllables.prefixes = ["muchtoolong", "al"];
    expect(
      NameGenerator.generateFirstName({ unisex: table }, undefined, () => 0),
    ).toBe("Alra");
    table.syllables.prefixes = ["muchtoolong"];
    expect(() =>
      NameGenerator.generateFirstName({ unisex: table }, undefined, () => 0),
    ).toThrow("constraints");
  });
  it("rejects empty tables, unusable patterns and invalid randomness", () => {
    const table = structuredClone(simple.unisex!);
    table.syllables.suffixes = [];
    expect(() => NameGenerator.generateFirstName({ unisex: table })).toThrow(
      "patterns",
    );
    table.patterns = ["P"];
    expect(() => NameGenerator.generateFirstName({ unisex: table })).toThrow(
      "syllable",
    );
    for (const value of [-0.1, 1, Infinity, NaN])
      expect(() =>
        NameGenerator.generateFirstName(simple, undefined, () => value),
      ).toThrow("Random");
  });
  it("uses the extracted ancestry tables for all name pools and length constraints", () => {
    for (const style of nameStyles)
      for (const gender of ["male", "female"] as const) {
        const config = style.config.unisex ?? style.config[gender]!;
        const random = seeded(73);
        for (let i = 0; i < 100; i++) {
          const first = NameGenerator.generateFirstName(
            style.config,
            gender,
            random,
          );
          expect(first.length).toBeGreaterThanOrEqual(
            config.constraints.minLength,
          );
          expect(first.length).toBeLessThanOrEqual(
            config.constraints.maxLength,
          );
          expect(first).toMatch(/^[A-Z]/);
          if (style.config.surnames) {
            const surname = NameGenerator.generateSurname(style.config, random);
            expect(surname.length).toBeGreaterThanOrEqual(
              style.config.surnames.constraints.minLength,
            );
            expect(surname.length).toBeLessThanOrEqual(
              style.config.surnames.constraints.maxLength,
            );
          }
        }
      }
  });
});
describe("offline NPC prompts", () => {
  it("produces reproducible names and four traits for every style without runtime platform APIs", () => {
    for (const style of nameStyles) {
      const one = generateNpc({ style: style.id }, seeded());
      expect(one).toEqual(generateNpc({ style: style.id }, seeded()));
      expect(generatedNpcSchema.safeParse(one).success).toBe(true);
      for (const kind of npcAttributeKinds)
        expect(npcAttributeTables[kind]).toContain(one.attributes[kind]);
    }
  });
  it("rerolls one trait or the name without changing the other details or mutating its input", () => {
    const original = generateNpc({}, () => 0);
    const rerolled = rerollNpcAttribute(original, "scar", () => 0.999);
    expect(rerolled.attributes.scar).not.toBe(original.attributes.scar);
    expect(rerolled.name).toBe(original.name);
    for (const kind of ["appearance", "mannerism", "quirk"] as const)
      expect(rerolled.attributes[kind]).toBe(original.attributes[kind]);
    expect(original.attributes.scar).toBe(npcAttributeTables.scar[0]);
    const renamed = rerollNpcName(original, () => 0.999);
    expect(renamed.name).not.toBe(original.name);
    expect(renamed.attributes).toEqual(original.attributes);
  });
  it("accepts custom attribute tables and bounds batch generation", () => {
    const tables = {
      appearance: ["Red cloak"],
      scar: ["A nicked ear"],
      mannerism: ["Whistles"],
      quirk: ["Collects spoons"],
    };
    expect(generateNpcAttributes(() => 0, tables)).toEqual({
      appearance: "Red cloak",
      scar: "A nicked ear",
      mannerism: "Whistles",
      quirk: "Collects spoons",
    });
    expect(
      generateNpcs(5, { style: "elf", gender: "female" }, seeded()),
    ).toHaveLength(5);
    for (const count of [0, -1, 101, 1.5, NaN])
      expect(() => generateNpcs(count)).toThrow("between 1 and 100");
    expect(() => generateNpc({ style: "unknown" as "elf" })).toThrow();
  });
});
