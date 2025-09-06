import { BackgroundDefinition } from "../../types/background";

export const fearless: BackgroundDefinition = {
  id: "fearless",
  name: "Fearless",
  description: "You are immune to the Frightened condition. +1 Initiative. -1 Armor.",
  features: [
    {
      id: "fearless-fear-immunity",
      name: "Fear Immunity",
      description: "You are immune to the Frightened condition.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "fearless-quick-reflexes",
      name: "Quick Reflexes",
      description: "+1 Initiative.",
      effects: [
        {
          id: "fearless-quick-reflexes-0",
          type: "stat_bonus",
          statBonus: {
            initiativeBonus: { type: "fixed", value: 1 },
          },
        },
      ],
    },
    {
      id: "fearless-reckless",
      name: "Reckless",
      description: "-1 Armor.",
      effects: [
        {
          id: "fearless-reckless-0",
          type: "stat_bonus",
          statBonus: {
            armorBonus: { type: "fixed", value: -1 },
          },
        },
      ],
    },
  ],
};
