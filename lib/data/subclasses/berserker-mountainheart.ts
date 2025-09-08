import { SubclassDefinition } from "../../schemas/class";
import { ClassFeature } from "@/lib/schemas/features";

const mountainheartFeatures: ClassFeature[] = [
  // Level 3
  {
    id: "mountainheart-stones-resilience",
    level: 3,
    name: "Stone's Resilience",
    description:
      "Whenever you expend Fury Dice to reduce incoming damage, add the value of the die to the amount reduced.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "mountainheart-tenacity",
    level: 3,
    name: "Mountain Tenacity",
    description:
      "Whenever you expend your Hit Dice to recover HP, for every 10 HP you would recover, you may heal 1 Wound instead.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 7
  {
    id: "mountainheart-unbreakable",
    level: 7,
    name: "Unbreakable",
    description:
      "(1/encounter) While Raging, if you would suffer your last Wound or other negative condition of your choice, you don't.",
    effects: [
      {
        id: "mountainheart-unbreakable-0",
        type: "ability",
        ability: {
          id: "unbreakable",
          name: "Unbreakable",
          description:
            "While Raging, if you would suffer your last Wound or other negative condition of your choice, you don't.",
          type: "action",
          frequency: "per_encounter",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  // Level 11
  {
    id: "mountainheart-titans-fury",
    level: 11,
    name: "Titan's Fury",
    description: "After you miss an attack or are crit by an enemy, Rage for free.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 15
  {
    id: "mountainheart-mountains-endurance",
    level: 15,
    name: "Mountain's Endurance",
    description:
      "While Dying, if an attack against you would be a crit, the attack is rerolled instead (when-crit abilities, such as Titan's Fury, still trigger).",
    effects: [], // Passive feature - no mechanical effects to process
  },
];

export const berserkerMountainheart: SubclassDefinition = {
  id: "path-of-the-mountainheart",
  name: "Path of the Mountainheart",
  description:
    "Berserkers who follow the Path of the Mountainheart embody the unyielding strength and endurance of mountains themselves. They become nearly impossible to bring down, shrugging off wounds that would fell lesser warriors.",
  parentClassId: "berserker",
  features: mountainheartFeatures,
};
