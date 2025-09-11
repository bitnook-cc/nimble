import { AncestryDefinition } from "../../schemas/ancestry";

export const ratfolk: AncestryDefinition = {
  id: "ratfolk",
  name: "Ratfolk",
  description:
    "Ratfolk are survivors, thriving in the shadows of society where others fear to tread. Agile, resourceful, and fiercely loyal to their own, they have a knack for turning scraps into solutions.",
  size: "small",
  rarity: "exotic",
  features: [
    {
      id: "ratfolk-scurry",
      name: "Scurry",
      description: "Gain +2 armor if you moved on your last turn.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "squeak",
          "nibble",
          "scurry",
          "whisker",
          "tail",
          "scamper",
          "dash",
          "quick",
          "swift",
          "clever",
          "sly",
          "sharp",
        ],
        middle: ["tail", "tooth", "claw", "nose", "ear", "eye", "paw"],
        suffixes: [
          "tail",
          "tooth",
          "claw",
          "nose",
          "ear",
          "eye",
          "paw",
          "kin",
          "folk",
          "runner",
          "squeaker",
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
