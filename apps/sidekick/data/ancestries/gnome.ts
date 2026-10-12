import { gnomeNames } from "@nimble/generators";

import { AncestryDefinition } from "@/lib/schemas/ancestry";

export const gnome: AncestryDefinition = {
  id: "gnome",
  name: "Gnome",
  description:
    "Eccentric, curious, and perpetually optimistic, gnomes are cheerful—especially when compared to their typically grumpier and larger kin, the dwarves. Known for their tinkering, spreading cheer, and playful antics, gnomes pursue their passions with a scatterbrained enthusiasm.",
  size: "small",
  rarity: "common",
  features: [
    {
      id: "gnome-optimistic",
      name: "Optimistic",
      description:
        "Allow an ally within Reach 6 to reroll any single die, resets when healed to your max HP. -1 Speed. You know Dwarvish if your INT is not negative (but you call it Gnomish, of course).",
      traits: [
        {
          id: "gnome-optimistic-0",
          type: "stat_bonus",
          statBonus: {
            speedBonus: { type: "fixed", value: -1 },
          },
        },
      ],
    },
  ],
  nameConfig: gnomeNames,
};
