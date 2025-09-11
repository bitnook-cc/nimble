import { ClassFeature } from "@/lib/schemas/features";

import { SubclassDefinition } from "../../schemas/class";

const bulwarkFeatures: ClassFeature[] = [
  // Level 3
  {
    id: "bulwark-armor-master",
    level: 3,
    name: "Armor Master",
    description: "You are proficient with plate armor.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "bulwark-shield-expert",
    level: 3,
    name: "Shield Expert",
    description:
      "While wearing a shield, you may Defend 2× each round. The first time each round you block all of the damage from an attack, you may make an opportunity attack against the attacker for free.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 7
  {
    id: "bulwark-juggernaut",
    level: 7,
    name: "Juggernaut",
    description:
      "When you use Coordinated Strike, you deal extra damage equal to your armor, and you can add 1 to your primary die.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 11
  {
    id: "bulwark-taunting-strike",
    level: 11,
    name: "Taunting Strike",
    description: "(1/turn) You may Taunt a creature you hit until the end of their next turn.",
    effects: [
      {
        id: "bulwark-taunting-strike-0",
        type: "ability",
        ability: {
          id: "taunting-strike",
          name: "Taunting Strike",
          description: "Taunt a creature you hit until the end of their next turn.",
          type: "action",
          frequency: "per_turn",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  // Level 15
  {
    id: "bulwark-shield-wall",
    level: 15,
    name: "Shield Wall",
    description: "Allies within 2 spaces gain ALL the benefits of the shield you have equipped.",
    effects: [], // Passive feature - no mechanical effects to process
  },
];

export const commanderBulwark: SubclassDefinition = {
  id: "champion-of-the-bulwark",
  name: "Champion of the Bulwark",
  description:
    "Commanders who become Champions of the Bulwark are immovable defenders who protect their allies with superior armor and shield techniques. They excel at drawing enemy attention and surviving punishment.",
  parentClassId: "commander",
  features: bulwarkFeatures,
};
