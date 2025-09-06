import { BackgroundDefinition } from "../../types/background";

export const survivalist: BackgroundDefinition = {
  id: "survivalist",
  name: "Survivalist",
  description:
    "You never run out of your own personal rations. Anything can be food if you try hard enough! Advantage against poison saves. +1 max Hit Die.",
  features: [
    {
      id: "survivalist-personal-rations",
      name: "Personal Rations",
      description:
        "You never run out of your own personal rations. Anything can be food if you try hard enough!",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "survivalist-poison-resistance",
      name: "Poison Resistance",
      description: "Advantage against poison saves.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "survivalist-hardy-constitution",
      name: "Hardy Constitution",
      description: "+1 max Hit Die.",
      effects: [
        {
          id: "survivalist-hardy-constitution-0",
          type: "stat_bonus",
          statBonus: {
            hitDiceBonus: { type: "fixed", value: 1 },
          },
        },
      ],
    },
  ],
};
