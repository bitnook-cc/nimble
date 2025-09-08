import { AncestryDefinition } from "../../schemas/ancestry";

export const fiendkin: AncestryDefinition = {
  id: "fiendkin",
  name: "Fiendkin",
  description:
    "Said to have been born from the union of man and fiend, or from a cursed bloodline, Fiendkin often find themselves outcasts in society. Yet, they embody determination in the face of adversity. Their ancestors didn't emerge from the depths of the Everflame to succumb to minor setbacks!",
  size: "medium",
  rarity: "exotic",
  features: [
    {
      id: "fiendkin-flameborn",
      name: "Flameborn",
      description:
        "1 of your neutral saves is advantaged instead. You know Infernal if your INT is not negative.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    male: {
      syllables: {
        prefixes: [
          "ash",
          "bane",
          "drak",
          "grim",
          "kael",
          "mal",
          "rath",
          "scar",
          "thorn",
          "vex",
          "zar",
          "neth",
          "vel",
          "mor",
        ],
        middle: ["an", "ar", "en", "er", "in", "ir", "on", "or", "ak", "ek"],
        suffixes: ["ax", "eth", "oth", "ash", "ard", "orn", "ius", "ek", "ak", "us", "on", "ar"],
      },
      patterns: ["P", "PM", "PS", "PMS"],
      constraints: {
        minLength: 4,
        maxLength: 12,
        syllableCount: { min: 1, max: 3 },
      },
    },
    female: {
      syllables: {
        prefixes: [
          "ash",
          "bel",
          "dara",
          "lil",
          "nyx",
          "raven",
          "sera",
          "vera",
          "zara",
          "mira",
          "kira",
          "vex",
          "neth",
        ],
        middle: ["a", "e", "i", "an", "ar", "en", "in", "ra", "na"],
        suffixes: ["a", "ah", "ina", "ara", "eth", "ith", "oth", "wyn", "ria", "lia", "ia"],
      },
      patterns: ["P", "PM", "PS", "PMS"],
      constraints: {
        minLength: 4,
        maxLength: 12,
        syllableCount: { min: 1, max: 3 },
      },
    },
    surnames: {
      syllables: {
        prefixes: [
          "ash",
          "blood",
          "dark",
          "fire",
          "hell",
          "night",
          "shadow",
          "soul",
          "thorn",
          "void",
          "flame",
          "bane",
        ],
        middle: ["heart", "soul", "mind", "eye", "hand", "wing"],
        suffixes: [
          "born",
          "bane",
          "heart",
          "soul",
          "mind",
          "eye",
          "hand",
          "wing",
          "thorn",
          "fire",
          "ash",
          "void",
        ],
      },
      patterns: ["P", "PS", "PM"],
      constraints: {
        minLength: 4,
        maxLength: 16,
        syllableCount: { min: 1, max: 2 },
      },
    },
  },
};
