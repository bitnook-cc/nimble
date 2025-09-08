import { SubclassDefinition } from "../../schemas/class";
import { ClassFeature } from "@/lib/schemas/features";

const skyAndStormFeatures: ClassFeature[] = [
  // Level 3
  {
    id: "deepening-study",
    level: 3,
    name: "Deepening Study",
    description: "Choose the Ice or Radiant school to learn.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "creature-of-the-fey",
    level: 3,
    name: "Creature of the Fey",
    description: "You may cast spells while Beastshifted.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "attuned-to-nature",
    level: 3,
    name: "Attuned to Nature",
    description: "(1/day) Add LVL to any skill check related to nature or weather.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 7
  {
    id: "raging-tempest",
    level: 7,
    name: "Raging Tempest",
    description:
      "Whenever you crit with a tiered spell, you may cast a cantrip for free from a school you know and haven't cast any spells from this turn (at the same level of dis/advantage).",
    effects: [
      {
        id: "raging-tempest-0",
        type: "ability",
        ability: {
          id: "raging-tempest",
          name: "Raging Tempest",
          description:
            "When you crit with a tiered spell, cast a free cantrip from a different school.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  // Level 11
  {
    id: "primordial-force",
    level: 11,
    name: "Primordial Force",
    description:
      "Spending 2+ mana on a spell grants an additional effect: Ice. Gain LVL temp HP | Lightning. Deal additional damage equal to your WIL | Radiant. You may heal a creature within 6 spaces WIL HP | Wind. Gain a flying speed this turn. Move up to 6 spaces for free.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 15
  {
    id: "master-of-storm",
    level: 15,
    name: "Master of Storm",
    description:
      "You can concentrate on 1 lightning spell and 1 wind spell at the same time. (1/Safe Rest) You can cast Hide the Lightning for 0 mana.",
    effects: [], // Passive feature - no mechanical effects to process
  },
];

export const circleOfSkyAndStorm: SubclassDefinition = {
  id: "circle-of-sky-and-storm",
  name: "Circle of Sky & Storm",
  description:
    "Stormshifters who focus on mastering elemental magic while shapeshifted, blending spell and beast forms seamlessly.",
  parentClassId: "stormshifter",
  features: skyAndStormFeatures,
};
