import { elfNames } from "@nimble/generators";

import { AncestryDefinition } from "@/lib/schemas/ancestry";

export const elf: AncestryDefinition = {
  id: "elf",
  name: "Elf",
  description:
    "Elves epitomize swiftness and grace. Their tall, slender forms belie their innate speed, grace, and wit. Formidable in both diplomacy and combat, elves strike swiftly, often preventing the worst by acting first.",
  size: "medium",
  rarity: "common",
  features: [
    {
      id: "elf-lithe",
      name: "Lithe",
      description:
        "Advantage on Initiative, +1 Speed. You know Elvish if your INT is not negative.",
      traits: [
        {
          id: "elf-lithe-0",
          type: "stat_bonus",
          statBonus: {
            speedBonus: { type: "fixed", value: 1 },
            initiativeBonus: { advantage: { type: "fixed", value: 1 } },
          },
        },
      ],
    },
  ],
  nameConfig: elfNames,
};
