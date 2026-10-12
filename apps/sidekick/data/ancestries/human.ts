import { humanNames } from "@nimble/generators";

import { AncestryDefinition } from "@/lib/schemas/ancestry";

export const human: AncestryDefinition = {
  id: "human",
  name: "Human",
  description:
    "Found in every terrain and environment, their curiosity and ambition drive them to explore every corner of the world, making them a ubiquitous and versatile race.",
  size: "medium",
  rarity: "common",
  features: [
    {
      id: "human-tenacious",
      name: "Tenacious",
      description: "+1 to all skills and Initiative.",
      traits: [
        {
          id: "human-tenacious-0",
          type: "stat_bonus",
          statBonus: {
            skillBonuses: {
              arcana: { bonus: { type: "fixed", value: 1 } },
              examination: { bonus: { type: "fixed", value: 1 } },
              finesse: { bonus: { type: "fixed", value: 1 } },
              influence: { bonus: { type: "fixed", value: 1 } },
              insight: { bonus: { type: "fixed", value: 1 } },
              might: { bonus: { type: "fixed", value: 1 } },
              lore: { bonus: { type: "fixed", value: 1 } },
              naturecraft: { bonus: { type: "fixed", value: 1 } },
              perception: { bonus: { type: "fixed", value: 1 } },
              stealth: { bonus: { type: "fixed", value: 1 } },
            },
            initiativeBonus: { bonus: { type: "fixed", value: 1 } },
          },
        },
      ],
    },
  ],
  nameConfig: humanNames,
};
