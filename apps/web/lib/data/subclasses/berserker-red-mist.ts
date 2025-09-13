import { ClassFeature } from "@/lib/schemas/features";

import { SubclassDefinition } from "../../schemas/class";

const redMistFeatures: ClassFeature[] = [
  // Level 3
  {
    id: "red-mist-blood-frenzy",
    level: 3,
    name: "Blood Frenzy",
    description:
      "(1/turn) While Raging, whenever you crit or kill an enemy, change 1 Fury Die to the maximum.",
    traits: [
      {
        id: "red-mist-blood-frenzy-0",
        type: "ability",
        ability: {
          id: "blood-frenzy",
          name: "Blood Frenzy",
          description:
            "While Raging, whenever you crit or kill an enemy, change 1 Fury Die to the maximum.",
          type: "action",
          frequency: "per_turn",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  {
    id: "red-mist-savage-awareness",
    level: 3,
    name: "Savage Awareness",
    description:
      "Advantage on Perception checks to notice or track down blood. Blindsight 2 while Raging: you ignore the Blinded condition and can see through darkness and Invisibility within that Range.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 7
  {
    id: "red-mist-unstoppable-brutality",
    level: 7,
    name: "Unstoppable Brutality",
    description: "While Raging, you may gain 1 Wound to reroll any attack or save.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 11
  {
    id: "red-mist-opportunistic-frenzy",
    level: 11,
    name: "Opportunistic Frenzy",
    description:
      "While Raging, you can make opportunity attacks without disadvantage, and you may make them whenever an enemy enters your melee weapon's reach.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 15
  {
    id: "red-mist-onslaught",
    level: 15,
    name: "Onslaught",
    description: "While Raging, gain +2 speed. (1/round) you may move for free.",
    traits: [], // Passive feature - no mechanical traits to process
  },
];

export const berserkerRedMist: SubclassDefinition = {
  id: "path-of-the-red-mist",
  name: "Path of the Red Mist",
  description:
    "Berserkers who follow the Path of the Red Mist become avatars of carnage on the battlefield. They gain supernatural awareness through the scent of blood and their fury transforms them into relentless killing machines.",
  parentClassId: "berserker",
  features: redMistFeatures,
};
