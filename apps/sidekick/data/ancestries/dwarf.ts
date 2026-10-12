import { dwarfNames } from "@nimble/generators";

import { AncestryDefinition } from "@/lib/schemas/ancestry";

export const dwarf: AncestryDefinition = {
  id: "dwarf",
  name: "Dwarf",
  description:
    'Dwarf, in the old language, means "stone." You are resilient, solid, stout. Even when driven to exhaustion, you will not falter. Forgoing speed, you are gifted with physical vitality and a belly that can handle the finest (and worst) consumables this world has to offer.',
  size: "medium",
  rarity: "common",
  features: [
    {
      id: "dwarf-stout",
      name: "Stout",
      description:
        "+2 max Hit Dice, +1 max Wounds, -1 Speed. You know Dwarvish if your INT is not negative.",
      traits: [
        {
          id: "dwarf-stout-0",
          type: "stat_bonus",
          statBonus: {
            hitDiceBonus: { type: "fixed", value: 2 },
            maxWoundsBonus: { type: "fixed", value: 1 },
            speedBonus: { type: "fixed", value: -1 },
          },
        },
      ],
    },
  ],
  nameConfig: dwarfNames,
};
