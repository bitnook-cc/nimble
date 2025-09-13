import { AncestryDefinition } from "../../schemas/ancestry";

export const crystalborn: AncestryDefinition = {
  id: "crystalborn",
  name: "Crystalborn",
  description:
    "Formed from living crystal, the Crystalborn are beings of dazzling beauty and otherworldly toughness. Their translucent bodies refract light and sound, granting them unique abilities in combat.",
  size: "medium",
  rarity: "exotic",
  features: [
    {
      id: "crystalborn-reflective-aura",
      name: "Reflective Aura",
      description:
        "When you Defend, gain KEY armor and deal KEY damage back to the attacker. 1/encounter.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "crystal",
          "prism",
          "quartz",
          "gem",
          "shard",
          "facet",
          "gleam",
          "shine",
          "spark",
          "glint",
          "dazzle",
          "bright",
        ],
        middle: ["song", "hum", "ring", "chime", "tone", "note", "echo"],
        suffixes: [
          "song",
          "hum",
          "ring",
          "chime",
          "tone",
          "note",
          "echo",
          "born",
          "made",
          "formed",
          "carved",
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
