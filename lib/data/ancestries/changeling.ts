import { AncestryDefinition } from "../../schemas/ancestry";

export const changeling: AncestryDefinition = {
  id: "changeling",
  name: "Changeling",
  description:
    "Often hunted for their silver blood, Changelings are natural survivors, slipping into new identities with ease. Changelings that shift too often typically aren't long for the world—they can struggle to remember who they were, becoming little more than reflections of the faces they wear.",
  size: "medium",
  rarity: "exotic",
  features: [
    {
      id: "changeling-new-place-new-face",
      name: "New Place, New Face",
      description:
        "+2 shifting skill points. You may take on the appearance of any ancestry. When you do, you may place your 2 shifting skill points into any 1 skill. 1/day.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: [
          "flux",
          "shift",
          "mist",
          "echo",
          "mirror",
          "shadow",
          "void",
          "drift",
          "phase",
          "blur",
          "vague",
          "wisp",
          "grey",
          "smoke",
        ],
        middle: ["walk", "step", "face", "mask", "veil", "cloak", "shift", "turn", "bend"],
        suffixes: [
          "walker",
          "stepper",
          "face",
          "mask",
          "veil",
          "cloak",
          "shifter",
          "turner",
          "bender",
          "ling",
          "born",
          "made",
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
