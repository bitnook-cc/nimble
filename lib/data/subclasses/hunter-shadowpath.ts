import { SubclassDefinition } from "../../types/class";

export const hunterShadowpath: SubclassDefinition = {
  id: "hunter-shadowpath",
  name: "Keeper of the Shadowpath",
  parentClassId: "hunter",
  description: "A hunter who blends stealth and cunning to stalk prey from the shadows.",
  features: [
    {
      id: "ambusher",
      level: 3,
      name: "Ambusher",
      description:
        "When you roll Initiative, you may use Hunter's Mark for free. Gain advantage on the first attack you make each encounter.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "skilled-tracker",
      level: 3,
      name: "Skilled Tracker",
      description: "You have advantage on skill checks to track creatures.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "skilled-navigator",
      level: 3,
      name: "Skilled Navigator",
      description: "You cannot become lost by nonmagical means.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "primal-predator",
      level: 7,
      name: "Primal Predator",
      description: "Your weapon attacks ignore cover and armor this turn.",
      effects: [
        {
          id: "primal-predator-0",
          type: "ability",
          ability: {
            id: "primal-predator",
            name: "Primal Predator",
            description: "Your weapon attacks ignore cover and armor this turn.",
            type: "action",
            frequency: "per_encounter",
            maxUses: { type: "fixed", value: 1 },
          },
        },
      ],
    },
    {
      id: "pack-hunter",
      level: 11,
      name: "Pack Hunter",
      description:
        "Whenever you mark a creature, you may also mark another creature within 6 spaces of them for free.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "apex-predator",
      level: 15,
      name: "Apex Predator",
      description:
        "You may use your Primal Predator ability twice each encounter. Gain 1 Thrill of the Hunt charge when you roll Initiative.",
      effects: [
        {
          id: "apex-predator-0",
          type: "ability",
          ability: {
            id: "primal-predator",
            name: "Primal Predator",
            description: "Your weapon attacks ignore cover and armor this turn.",
            type: "action",
            frequency: "per_encounter",
            maxUses: { type: "fixed", value: 2 },
          },
        },
      ],
    },
  ],
};
