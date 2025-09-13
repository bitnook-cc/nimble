import { AncestryDefinition } from "../../schemas/ancestry";

export const stoatling: AncestryDefinition = {
  id: "stoatling",
  name: "Stoatling",
  description:
    "Stoatlings may be small, but they're far from weak. With fierce determination and warrior hearts, they can take down foes many times their size. Their agility and tenacity let them exploit larger enemies' weaknesses, turning their size into a lethal advantage.",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "stoatling-small-but-ferocious",
      name: "Small But Ferocious",
      description:
        "Whenever you make a single-target attack against a creature larger than you, roll 1 additional d6 for each size category it is larger. They do the same.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "fierce",
          "brave",
          "bold",
          "quick",
          "dart",
          "dash",
          "leap",
          "bound",
          "small",
          "tiny",
          "swift",
          "nimble",
        ],
        middle: ["claw", "tooth", "tail", "paw", "heart", "spirit"],
        suffixes: [
          "claw",
          "tooth",
          "tail",
          "paw",
          "heart",
          "spirit",
          "ling",
          "kin",
          "born",
          "made",
        ],
      },
      patterns: ["P", "PS", "PM"],
      constraints: {
        minLength: 4,
        maxLength: 12,
        syllableCount: { min: 1, max: 2 },
      },
    },
  },
};
