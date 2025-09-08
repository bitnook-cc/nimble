import { BackgroundDefinition } from "../../schemas/background";

export const homeAtSea: BackgroundDefinition = {
  id: "home-at-sea",
  name: "Home at Sea",
  description:
    "Recover twice as many Wounds and HP while resting on a ship or near water. You can fill in for a first mate or captain in a pinch. Advantage on water-related skill checks.",
  features: [
    {
      id: "home-at-sea-nautical-recovery",
      name: "Nautical Recovery",
      description: "Recover twice as many Wounds and HP while resting on a ship or near water.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "home-at-sea-seamanship",
      name: "Seamanship",
      description:
        "You can fill in for a first mate or captain in a pinch. Advantage on water-related skill checks.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
