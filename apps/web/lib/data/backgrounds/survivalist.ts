import { BackgroundDefinition } from "../../schemas/background";

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
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "survivalist-poison-resistance",
      name: "Poison Resistance",
      description: "Advantage against poison saves.",
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "survivalist-hardy-constitution",
      name: "Hardy Constitution",
      description: "+1 max Hit Die.",
      traits: [
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
