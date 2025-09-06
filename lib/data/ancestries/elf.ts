import { AncestryDefinition } from "../../types/ancestry";
import { NameConfig } from "../../utils/name-generator";

const elfNames: NameConfig = {
  male: {
    syllables: {
      prefixes: [
        "ae",
        "al",
        "cel",
        "el",
        "en",
        "er",
        "gal",
        "gil",
        "leg",
        "lin",
        "tha",
        "thy",
        "val",
      ],
      middle: ["a", "e", "i", "o", "an", "en", "in", "on", "ar", "or", "ad", "ed"],
      suffixes: ["dir", "las", "lon", "mir", "neth", "reth", "rond", "thil", "wen", "wing"],
    },
    patterns: ["PM", "PS", "PMS"],
    constraints: {
      minLength: 4,
      maxLength: 14,
      syllableCount: { min: 2, max: 3 },
    },
  },
  female: {
    syllables: {
      prefixes: ["al", "ar", "cel", "el", "gal", "gil", "nim", "sil", "tar", "thy", "val"],
      middle: ["a", "e", "i", "o", "ae", "ai", "an", "ar", "el", "en", "in"],
      suffixes: ["ath", "iel", "wen", "wyn", "riel", "neth", "thil", "lia", "ara", "ina"],
    },
    patterns: ["PM", "PS", "PMS"],
    constraints: {
      minLength: 4,
      maxLength: 14,
      syllableCount: { min: 2, max: 3 },
    },
  },
  surnames: {
    syllables: {
      prefixes: [
        "bright",
        "silver",
        "moon",
        "star",
        "sun",
        "wind",
        "storm",
        "flame",
        "shadow",
        "mist",
      ],
      middle: ["leaf", "song", "whisper", "dance", "flame", "stream", "light"],
      suffixes: ["song", "leaf", "wind", "star", "moon", "light", "bow", "blade", "heart", "wing"],
    },
    patterns: ["PS", "PM"],
    constraints: {
      minLength: 4,
      maxLength: 16,
      syllableCount: { min: 1, max: 2 },
    },
  },
};

export const elf: AncestryDefinition = {
  id: "elf",
  name: "Elf",
  description:
    "Elves epitomize swiftness and grace. Their tall, slender forms belie their innate speed, grace, and wit. Formidable in both diplomacy and combat, elves strike swiftly, often preventing the worst by acting first.",
  size: "medium",
  rarity: "common",
  features: [
    {
      id: "elf-lithe",
      name: "Lithe",
      description:
        "Advantage on Initiative, +1 Speed. You know Elvish if your INT is not negative.",
      effects: [
        {
          id: "elf-lithe-0",
          type: "stat_bonus",
          statBonus: {
            speedBonus: { type: "fixed", value: 1 },
          },
        },
      ],
    },
  ],
  nameConfig: elfNames,
};
