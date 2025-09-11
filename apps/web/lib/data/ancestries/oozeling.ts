import { AncestryDefinition } from "../../schemas/ancestry";

export const oozeling: AncestryDefinition = {
  id: "oozeling",
  name: "Oozeling/Construct",
  description:
    "What even is a \"PeOpLe\" anyway? So what if your heart pumps oil instead of blood, so what if you don't even have a heart!? If you can squish yourself into a pair of pants, or swing a sword like everyone else, who's to say you can't be a pEOpLe, too?!",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "oozeling-odd-constitution",
      name: "Odd Constitution",
      description:
        "Increment your Hit Dice one step (d6 » d8 » d10 » d12 » d20); they always heal you for the maximum amount. Magical healing always heals you for the minimum amount.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "goo",
          "slime",
          "ooze",
          "gel",
          "blob",
          "gloop",
          "squish",
          "splurt",
          "drip",
          "flow",
          "puddle",
          "splash",
        ],
        middle: ["drop", "drip", "blob", "pop", "plop", "squish", "squelch"],
        suffixes: [
          "drop",
          "drip",
          "blob",
          "pop",
          "plop",
          "squish",
          "squelch",
          "ling",
          "let",
          "kin",
          "born",
        ],
      },
      patterns: ["P", "PS", "PM"],
      constraints: {
        minLength: 3,
        maxLength: 12,
        syllableCount: { min: 1, max: 2 },
      },
    },
  },
};
