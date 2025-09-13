import { AncestryDefinition } from "../../schemas/ancestry";

export const birdfolk: AncestryDefinition = {
  id: "birdfolk",
  name: "Birdfolk",
  description:
    "Birdfolk find sanctuary not in stone or chains, but within the boundless expanse of the sky. However, the gift of flight comes at a cost—hollow bones, and commensurate frailty.",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "birdfolk-hollow-bones",
      name: "Hollow Bones",
      description:
        "You have a fly Speed as long as you are wearing armor no heavier than Leather. Crits against you are Vicious (the attacker rolls 1 additional die). Forced movement moves you twice as far.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "aer",
          "avi",
          "sky",
          "wing",
          "crow",
          "hawk",
          "eagle",
          "swift",
          "storm",
          "wind",
          "cloud",
          "dawn",
          "dusk",
          "sun",
          "moon",
        ],
        middle: ["wing", "song", "call", "cry", "soar", "fly", "dive", "glide", "nest", "perch"],
        suffixes: [
          "wing",
          "song",
          "call",
          "cry",
          "soar",
          "flight",
          "feather",
          "beak",
          "talon",
          "nest",
          "perch",
          "sky",
          "air",
        ],
      },
      patterns: ["P", "PS", "PM"],
      constraints: {
        minLength: 4,
        maxLength: 14,
        syllableCount: { min: 1, max: 2 },
      },
    },
  },
};
