import { AncestryDefinition } from "../../schemas/ancestry";

export const minotaur: AncestryDefinition = {
  id: "minotaur",
  name: "Minotaur/Beastfolk",
  description:
    "Minotaur and other Beastfolk embody a primal connection to The Wild, combining strength with natural agility. Their powerful build allows them to move swiftly, whether repositioning to outflank foes or charging in with unstoppable force.",
  size: "medium",
  rarity: "exotic",
  features: [
    {
      id: "minotaur-charge",
      name: "Charge",
      description:
        "When you move at least 4 spaces, you can push a creature in your path. Medium: 1 space; Small/Tiny: up to 2 spaces. 1/turn.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    male: {
      syllables: {
        prefixes: [
          "bull",
          "horn",
          "thund",
          "storm",
          "rage",
          "fury",
          "wild",
          "beast",
          "strong",
          "might",
          "power",
          "force",
        ],
        middle: ["horn", "hoof", "charge", "rush", "strike", "crush"],
        suffixes: [
          "horn",
          "hoof",
          "charge",
          "rush",
          "strike",
          "crusher",
          "born",
          "blood",
          "heart",
          "soul",
        ],
      },
      patterns: ["P", "PS", "PM"],
      constraints: {
        minLength: 4,
        maxLength: 14,
        syllableCount: { min: 1, max: 2 },
      },
    },
    female: {
      syllables: {
        prefixes: [
          "wild",
          "free",
          "swift",
          "grace",
          "moon",
          "star",
          "wind",
          "storm",
          "earth",
          "nature",
          "spirit",
        ],
        middle: ["heart", "soul", "song", "dance", "run", "leap"],
        suffixes: [
          "heart",
          "soul",
          "song",
          "dance",
          "runner",
          "leaper",
          "born",
          "maiden",
          "horn",
          "hoof",
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
