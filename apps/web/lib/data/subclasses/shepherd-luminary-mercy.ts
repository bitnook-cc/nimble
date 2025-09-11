import { SubclassDefinition } from "../../schemas/class";

export const shepherdLuminaryMercy: SubclassDefinition = {
  id: "shepherd-luminary-mercy",
  name: "Luminary of Mercy",
  parentClassId: "shepherd",
  description:
    "A shepherd who embraces the healing light, dedicated to preserving life and bringing comfort to the suffering.",
  features: [
    {
      id: "merciful-healing",
      level: 3,
      name: "Merciful Healing",
      description:
        "When an effect caused by you heals a Dying creature, they are healed for twice as much. (1/round) Your Lifebinding Spirit can act for free while you are Dying.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "life-is-beautiful",
      level: 3,
      name: "Life is Beautiful",
      description:
        "Harmless and lovely creatures such as butterflies and humming birds are attracted to your presence and often follow you. Flowers bloom more vibrantly in your presence.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "conduit-of-light",
      level: 7,
      name: "Conduit of Light",
      description:
        "When an effect caused by you would heal HP, you may expend 1 use of Searing Light to heal (or damage, ignoring armor) another target within 6 spaces of yourself for the same amount.",
      effects: [
        {
          id: "conduit-of-light-0",
          type: "ability",
          ability: {
            id: "conduit-of-light",
            name: "Conduit of Light",
            description:
              "When you heal HP, expend 1 Searing Light to heal/damage another target for the same amount.",
            type: "action",
            frequency: "at_will",
          },
        },
      ],
    },
    {
      id: "powerful-healer",
      level: 11,
      name: "Powerful Healer",
      description:
        "(WIL times/Safe Rest) Whenever you would roll dice to heal damage, you may instead heal the max amount you could roll, or give that many temp HP.",
      effects: [
        {
          id: "powerful-healer-0",
          type: "ability",
          ability: {
            id: "powerful-healer",
            name: "Powerful Healer",
            description:
              "Instead of rolling healing dice, heal the max amount or give that many temp HP.",
            type: "action",
            frequency: "per_safe_rest",
            maxUses: { type: "formula", expression: "WIL" },
          },
        },
      ],
    },
    {
      id: "empowered-conduit",
      level: 15,
      name: "Empowered Conduit",
      description:
        "Your Conduit of Light may target 1 additional creature. Regain 1 charge of Searing Light when you roll Initiative (this expires if unspent at the end of combat).",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
