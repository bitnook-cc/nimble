import { AncestryDefinition } from "../../types/ancestry";

export const bunbun: AncestryDefinition = {
  id: "bunbun",
  name: "Bunbun",
  description:
    "Bunbun are agile and unpredictable, using their powerful legs to leap great distances and catch foes off guard. Facing a Bunbun means contending with an opponent who can strike from unexpected angles and swiftly reposition themselves in the heat of battle.",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "bunbun-bunny-legs",
      name: "Bunny Legs",
      description:
        "Before Interposing or after Defending (after damage), hop up to your Speed in any direction for free, 1/encounter.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "hop",
          "skip",
          "bounce",
          "fluffy",
          "cotton",
          "whiskers",
          "bunny",
          "carrot",
          "clover",
          "daisy",
          "pepper",
          "ginger",
          "honey",
          "maple",
          "willow",
        ],
        middle: ["tail", "paw", "ear", "nose", "hop", "bound", "jump", "spring", "leap", "dash"],
        suffixes: [
          "paw",
          "tail",
          "ear",
          "nose",
          "hop",
          "bound",
          "foot",
          "whiskers",
          "cotton",
          "fluff",
          "spring",
          "dash",
          "bounce",
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
