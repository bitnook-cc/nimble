import { ClassFeature } from "@/lib/schemas/features";

import { SubclassDefinition } from "../../schemas/class";

const wayOfFlameFeatures: ClassFeature[] = [
  // Level 3
  {
    id: "exploding-soul",
    level: 3,
    name: "Exploding Soul",
    description:
      "(1/round) On your turn, you may suffer a Wound. Whenever you gain a Wound, deal STR + Wounds damage to any creatures you choose within 2 spaces (ignoring armor) and give them the Smoldering condition.",
    traits: [
      {
        id: "exploding-soul-0",
        type: "ability",
        ability: {
          id: "exploding-soul",
          name: "Exploding Soul",
          description:
            "Suffer a Wound to deal STR + Wounds damage to creatures within 2 spaces (ignoring armor) and apply Smoldering.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  // Level 7
  {
    id: "blazing-speed",
    level: 7,
    name: "Blazing Speed",
    description:
      "Gain +2 speed while using Windstep. After you cease movement with Windstep, enemies you passed through take STR + DEX fire damage. You may have Smoldering enemies take double, ending the condition.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 11
  {
    id: "chain-reaction",
    level: 11,
    name: "Chain Reaction",
    description:
      "(1/turn) When you crit, deal fire damage equal to your STR + Wounds to creatures of your choice within 2 spaces of your target. Repeat any number of times, targeting creatures not yet damaged by this effect within 2 spaces of any already damaged.",
    traits: [
      {
        id: "chain-reaction-0",
        type: "ability",
        ability: {
          id: "chain-reaction",
          name: "Chain Reaction",
          description:
            "On crit, deal STR + Wounds fire damage to creatures within 2 spaces of target, then chain to new targets.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  // Level 15
  {
    id: "burning-soul",
    level: 15,
    name: "Burning Soul",
    description: "Double any fire damage you deal.",
    traits: [], // Passive feature - no mechanical traits to process
  },
];

export const wayOfFlame: SubclassDefinition = {
  id: "way-of-flame",
  name: "Way of Flame",
  description:
    "Zephyrs who channel their inner fire, burning with passion and leaving trails of destruction in their wake.",
  parentClassId: "zephyr",
  features: wayOfFlameFeatures,
};
