import { AncestryDefinition } from "../../schemas/ancestry";

export const wyrdling: AncestryDefinition = {
  id: "wyrdling",
  name: "Wyrdling",
  description:
    "Unpredictable and chaotic, Wyrdlings are the result of magic gone awry. Their bodies pulse with raw arcane energy, and their mere presence often disturbs the balance of magic around them.",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "wyrdling-chaotic-surge",
      name: "Chaotic Surge",
      description:
        "Whenever you or a willing ally within Reach 6 casts a tiered spell, you may allow them to roll on the Chaos Table. 1/encounter.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "chaos",
          "wild",
          "weird",
          "strange",
          "odd",
          "twist",
          "flux",
          "shift",
          "change",
          "warp",
          "bend",
          "magic",
        ],
        middle: ["spark", "surge", "burst", "flash", "pop", "crack", "twist"],
        suffixes: [
          "spark",
          "surge",
          "burst",
          "flash",
          "pop",
          "crack",
          "twist",
          "ling",
          "kin",
          "born",
          "made",
          "touched",
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
