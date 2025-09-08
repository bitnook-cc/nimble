import { BackgroundDefinition } from "../../schemas/background";

export const wildOne: BackgroundDefinition = {
  id: "wild-one",
  name: "Wild One",
  description:
    "Whether it is the sticks or flowers in your hair, your smell, or the way you carry yourself, wild creatures are less frightened of you and more willing to aid you. +1 Naturecraft. While Field Resting, roll your Hit Dice with advantage while in the wild.",
  features: [
    {
      id: "wild-one-one-with-nature",
      name: "One with Nature",
      description:
        "Wild creatures are less frightened of you and more willing to aid you. +1 Naturecraft.",
      effects: [
        {
          id: "wild-one-one-with-nature-0",
          type: "stat_bonus",
          statBonus: {
            skillBonuses: {
              naturecraft: { type: "fixed", value: 1 },
            },
          },
        },
      ],
    },
    {
      id: "wild-one-wild-rest",
      name: "Wild Rest",
      description: "While Field Resting, roll your Hit Dice with advantage while in the wild.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
