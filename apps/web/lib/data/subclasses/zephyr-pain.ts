import { ClassFeature } from "@/lib/schemas/features";

import { SubclassDefinition } from "../../schemas/class";

const wayOfPainFeatures: ClassFeature[] = [
  // Level 3
  {
    id: "bring-the-pain",
    level: 3,
    name: "Bring the Pain",
    description:
      "(1/round) You may turn any melee attack against you into a crit. Whenever you are crit, reduce the damage by half. The attacker takes the same amount of damage you took (ignoring armor). You may suffer 1 Wound to double the damage the enemy takes.",
    traits: [
      {
        id: "bring-the-pain-0",
        type: "ability",
        ability: {
          id: "bring-the-pain",
          name: "Bring the Pain",
          description:
            "Turn any melee attack into a crit. When crit, take half damage and reflect it to attacker. Suffer 1 Wound to double reflected damage.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  // Level 7
  {
    id: "share-my-pain",
    level: 7,
    name: "Share My Pain",
    description: "Your Swiftstrike can also target a 2nd creature within Reach 2.",
    traits: [
      {
        id: "share-my-pain-0",
        type: "ability",
        ability: {
          id: "share-my-pain",
          name: "Share My Pain",
          description: "Swiftstrike can target a 2nd creature within Reach 2.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  // Level 11
  {
    id: "pain-sharpens-the-mind",
    level: 11,
    name: "Pain Sharpens the Mind",
    description:
      "While you are Bloodied, gain advantage on the first attack you make each turn, and on all saves.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 15
  {
    id: "echoed-agony",
    level: 15,
    name: "Echoed Agony",
    description: "Your Swiftstrike can also target a 3rd creature within Reach 4.",
    traits: [
      {
        id: "echoed-agony-0",
        type: "ability",
        ability: {
          id: "echoed-agony",
          name: "Echoed Agony",
          description: "Swiftstrike can target a 3rd creature within Reach 4.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
];

export const wayOfPain: SubclassDefinition = {
  id: "way-of-pain",
  name: "Way of Pain",
  description:
    "Zephyrs who embrace pain as a teacher, turning damage taken into power and reflecting suffering back upon their enemies.",
  parentClassId: "zephyr",
  features: wayOfPainFeatures,
};
