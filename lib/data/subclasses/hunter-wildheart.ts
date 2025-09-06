import { SubclassDefinition } from "../../types/class";

export const hunterWildheart: SubclassDefinition = {
  id: "hunter-wildheart",
  name: "Keeper of the Wild Heart",
  parentClassId: "hunter",
  description: "A hunter who channels primal strength and forms deep bonds with the wilderness.",
  features: [
    {
      id: "impressive-form",
      level: 3,
      name: "Impressive Form",
      description: "+5 max HP. Upgrade your Hit Dice to d10s.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "i-have-the-high-ground",
      level: 3,
      name: "I Have the High Ground",
      description:
        "When you roll Initiative or gain one or more Thrill of the Hunt charges, move up to half your speed for free, ignoring difficult terrain.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "resourceful-herbalist",
      level: 7,
      name: "Resourceful Herbalist",
      description:
        "Whenever you Safe Rest in a location near where plants or fungi can grow, you may spend 4 gold and gain a healing herbs to craft a number of Healing Salves equal to your WIL.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "healing-salve",
      level: 7,
      name: "Healing Salve",
      description:
        "Heal yourself or an adjacent creature WIL d6 HP. Only you or another Advanced Herbalist may activate these, and they expire whenever you Safe Rest.",
      effects: [
        {
          id: "healing-salve-0",
          type: "ability",
          ability: {
            id: "healing-salve",
            name: "Healing Salve",
            description:
              "Heal yourself or an adjacent creature WIL d6 HP. Only you or another Advanced Herbalist may activate these, and they expire whenever you Safe Rest.",
            type: "action",
            frequency: "at_will",
            actionCost: 1,
          },
        },
      ],
    },
    {
      id: "ha-im-over-here",
      level: 11,
      name: "Ha! I'm Over Here!",
      description:
        "If an attack would cause you to drop to 0 HP, you instead move up to your speed away and take no damage.",
      effects: [
        {
          id: "ha-im-over-here-0",
          type: "ability",
          ability: {
            id: "ha-im-over-here",
            name: "Ha! I'm Over Here!",
            description:
              "If an attack would cause you to drop to 0 HP, you instead move up to your speed away and take no damage.",
            type: "action",
            frequency: "per_safe_rest",
            maxUses: { type: "fixed", value: 1 },
          },
        },
      ],
    },
    {
      id: "unparalleled-survivalist",
      level: 15,
      name: "Unparalleled Survivalist",
      description:
        "Gain +WIL armor. When you attack with a ranged weapon, you may first move half your speed for free.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
