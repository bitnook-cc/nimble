import { BackgroundDefinition } from "../../schemas/background";

export const secretlyUndead: BackgroundDefinition = {
  id: "secretly-undead",
  name: "(Secretly) Undead",
  description:
    "Unnatural Resilience: You are immune to disease and do not need to eat, drink, or breathe. Children, animals, and Celestials are uneasy in your presence; many will be horrified to discover your true nature.",
  features: [
    {
      id: "secretly-undead-unnatural-resilience",
      name: "Unnatural Resilience",
      description: "You are immune to disease and do not need to eat, drink, or breathe.",
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "secretly-undead-unsettling-presence",
      name: "Unsettling Presence",
      description:
        "Children, animals, and Celestials are uneasy in your presence; many will be horrified to discover your true nature.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
