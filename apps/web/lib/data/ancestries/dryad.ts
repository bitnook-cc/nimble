import { AncestryDefinition } from "../../schemas/ancestry";

export const dryad: AncestryDefinition = {
  id: "dryad",
  name: "Dryad/Shroomling",
  description:
    "Tied to the natural world, Dryads and Shroomlings embody the balance between flora and fauna. Their unique physiology releases toxic spores when harmed, providing a natural defense against those who dare to harm them.",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "dryad-danger-pollen-spores",
      name: "Danger Pollen/Spores",
      description:
        "Whenever an enemy causes you one or more Wounds, you excrete soporific spores: all adjacent enemies are Dazed. You know Elvish if your INT is not negative.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "oak",
          "ash",
          "elm",
          "willow",
          "birch",
          "moss",
          "fern",
          "leaf",
          "bloom",
          "petal",
          "root",
          "bark",
          "thorn",
          "vine",
          "spore",
          "cap",
        ],
        middle: ["song", "whisper", "dance", "sway", "grow", "bloom", "flow"],
        suffixes: [
          "song",
          "whisper",
          "dance",
          "sway",
          "grove",
          "bloom",
          "flow",
          "born",
          "wood",
          "leaf",
          "root",
          "branch",
        ],
      },
      patterns: ["P", "PS", "PM"],
      constraints: {
        minLength: 3,
        maxLength: 14,
        syllableCount: { min: 1, max: 2 },
      },
    },
  },
};
