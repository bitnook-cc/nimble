import { AncestryDefinition } from "../../schemas/ancestry";
import { NameConfig } from "../../utils/name-generator";

const halflingNames: NameConfig = {
  male: {
    syllables: {
      prefixes: [
        "bil",
        "bob",
        "dro",
        "fro",
        "mer",
        "per",
        "pip",
        "sam",
        "ted",
        "tom",
        "ban",
        "pod",
      ],
      middle: ["a", "e", "i", "o", "er", "ar", "in", "on", "od", "id"],
      suffixes: ["bo", "do", "go", "to", "rin", "ron", "son", "wich", "wick", "wise"],
    },
    patterns: ["PM", "PS", "PMS"],
    constraints: {
      minLength: 3,
      maxLength: 11,
      syllableCount: { min: 2, max: 3 },
    },
  },
  female: {
    syllables: {
      prefixes: ["bell", "daisy", "hol", "lil", "may", "prim", "ros", "rue", "poppy", "pearl"],
      middle: ["a", "e", "i", "o", "an", "en", "in", "la", "ly"],
      suffixes: ["a", "y", "ie", "ina", "ella", "wyn", "rose", "lily", "belle"],
    },
    patterns: ["PM", "PS", "PMS"],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 },
    },
  },
  surnames: {
    syllables: {
      prefixes: [
        "bag",
        "took",
        "brand",
        "boff",
        "brown",
        "good",
        "green",
        "under",
        "over",
        "hedge",
      ],
      middle: ["hill", "buck", "foot", "bottom", "top", "burrow"],
      suffixes: ["gins", "buck", "foot", "bottom", "hill", "burrow", "field", "garden", "meadow"],
    },
    patterns: ["PS", "PM"],
    constraints: {
      minLength: 3,
      maxLength: 16,
      syllableCount: { min: 1, max: 2 },
    },
  },
};

export const halfling: AncestryDefinition = {
  id: "halfling",
  name: "Halfling",
  description:
    "Kind of like a human, but smaller (except for the feet). Where does our luck come from? Well...you know what they say about rabbit feet? Well, we've got feet for days compared to them. Imagine the amount of luck you could fit into these bad boys!",
  size: "small",
  rarity: "common",
  features: [
    {
      id: "halfling-elusive",
      name: "Elusive",
      description: "+1 to Stealth. If you fail a save, you can succeed instead, 1/Safe Rest.",
      traits: [
        {
          id: "halfling-elusive-0",
          type: "stat_bonus",
          statBonus: {
            skillBonuses: {
              stealth: { type: "fixed", value: 1 },
            },
          },
        },
      ],
    },
  ],
  nameConfig: halflingNames,
};
