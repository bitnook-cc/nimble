import { halflingNames } from "@nimble/generators";

import { AncestryDefinition } from "@/lib/schemas/ancestry";

export const halfling: AncestryDefinition = {
  id: "halfling",
  name: "Halfling",
  description:
    "Kind of like a human, but smaller (except for the feet). Where does our luck come from? Well...you know what they say about rabbit feet? Well, we've got feet for days compared to them. Imagine the amount of luck you could fit into these bad boys!",
  size: "small",
  rarity: "common",
  features: [
    {
      id: "halfling-elusive",
      name: "Elusive",
      description: "+1 to Stealth. If you fail a save, you can succeed instead, 1/Safe Rest.",
      traits: [
        {
          id: "halfling-elusive-0",
          type: "stat_bonus",
          statBonus: {
            skillBonuses: {
              stealth: { bonus: { type: "fixed", value: 1 } },
            },
          },
        },
      ],
    },
  ],
  nameConfig: halflingNames,
};
