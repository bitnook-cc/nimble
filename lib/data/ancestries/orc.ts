import { AncestryDefinition } from "../../types/ancestry";

export const orc: AncestryDefinition = {
  id: "orc",
  name: "Orc",
  description:
    "Just when you think you've bested a mighty Orc, you've merely succeeded in rousing their anger. Engaging in combat with an Orc is no endeavor for the weak-willed. While others may cower before death's approach, Orcs boldly defy its grasp.",
  size: "medium",
  rarity: "exotic",
  features: [
    {
      id: "orc-relentless",
      name: "Relentless",
      description:
        "When you would drop to 0 HP, you may set your HP to LVL instead, 1/Safe Rest. +1 Might. You know Goblin if your INT is not negative (but you call it Orcish, of course).",
      effects: [
        {
          id: "orc-relentless-0",
          type: "stat_bonus",
          statBonus: {
            skillBonuses: {
              might: { type: "fixed", value: 1 },
            },
          },
        },
      ],
    },
  ],
  nameConfig: {
    male: {
      syllables: {
        prefixes: [
          "gra",
          "gro",
          "gru",
          "kro",
          "mor",
          "rog",
          "thra",
          "ugh",
          "urk",
          "var",
          "gur",
          "mag",
          "bru",
          "drak",
        ],
        middle: ["ak", "ok", "uk", "ag", "og", "ug", "ar", "or", "ur"],
        suffixes: [
          "ash",
          "gul",
          "mash",
          "nak",
          "narg",
          "rog",
          "ugh",
          "urk",
          "goth",
          "tok",
          "lok",
          "gak",
        ],
      },
      patterns: ["P", "PM", "PS"],
      constraints: {
        minLength: 3,
        maxLength: 10,
        syllableCount: { min: 1, max: 2 },
      },
    },
    female: {
      syllables: {
        prefixes: [
          "gra",
          "kri",
          "mog",
          "rog",
          "sha",
          "ugh",
          "var",
          "yar",
          "zog",
          "bru",
          "dra",
          "mag",
        ],
        middle: ["a", "o", "u", "ak", "ok", "uk"],
        suffixes: ["a", "ash", "ga", "ka", "na", "ra", "sha", "tha", "gul", "mog"],
      },
      patterns: ["P", "PM", "PS"],
      constraints: {
        minLength: 3,
        maxLength: 10,
        syllableCount: { min: 1, max: 2 },
      },
    },
    surnames: {
      syllables: {
        prefixes: [
          "blood",
          "bone",
          "death",
          "fire",
          "iron",
          "skull",
          "stone",
          "war",
          "wolf",
          "rage",
          "storm",
          "black",
        ],
        middle: ["tooth", "claw", "fist", "axe", "blade", "hammer"],
        suffixes: [
          "tooth",
          "claw",
          "fist",
          "axe",
          "blade",
          "hammer",
          "crusher",
          "basher",
          "slayer",
          "bane",
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
