import { AncestryDefinition } from "../../types/ancestry";

export const kobold: AncestryDefinition = {
  id: "kobold",
  name: "Kobold",
  description:
    "Small, often maniacal, and dragon-obsessed. Kobolds thrive in the shadows, finding ingenious ways to survive despite their diminutive size. Underestimated by many, Kobolds prove time and again that even the smallest among us can wield great power.",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "kobold-wily",
      name: "Wily",
      description:
        "Force an enemy to reroll a non-critical attack against you, 1/encounter. +3 to Influence friendly characters. Advantage on skill checks related to dragons. You know Draconic if your INT is not negative.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "krik",
          "skib",
          "yik",
          "mek",
          "kek",
          "yap",
          "nip",
          "kip",
          "zik",
          "pik",
          "grik",
          "slik",
          "trik",
          "wik",
        ],
        middle: ["ak", "ek", "ik", "ok", "uk", "a", "e", "i", "o"],
        suffixes: [
          "yip",
          "kik",
          "tak",
          "nak",
          "lak",
          "rek",
          "dak",
          "zak",
          "pak",
          "bak",
          "gak",
          "mak",
        ],
      },
      patterns: ["P", "PM", "PS"],
      constraints: {
        minLength: 3,
        maxLength: 8,
        syllableCount: { min: 1, max: 2 },
      },
    },
  },
};
