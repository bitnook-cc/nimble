import { BackgroundDefinition } from "../../schemas/background";

export const fearless: BackgroundDefinition = {
  id: "fearless",
  name: "Fearless",
  description: "You are immune to the Frightened condition. +1 Initiative. -1 Armor.",
  features: [
    {
      id: "fearless-fear-immunity",
      name: "Fear Immunity",
      description: "You are immune to the Frightened condition.",
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "fearless-quick-reflexes",
      name: "Quick Reflexes",
      description: "+1 Initiative.",
      traits: [
        {
          id: "fearless-quick-reflexes-0",
          type: "stat_bonus",
          statBonus: {
            initiativeBonus: { bonus: { type: "fixed", value: 1 } },
          },
        },
      ],
    },
    {
      id: "fearless-reckless",
      name: "Reckless",
      description: "-1 Armor.",
      traits: [
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
