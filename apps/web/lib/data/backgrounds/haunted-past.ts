import { BackgroundDefinition } from "../../schemas/background";

export const hauntedPast: BackgroundDefinition = {
  id: "haunted-past",
  name: "Haunted Past",
  description:
    "You are haunted by voices that occasionally give you cryptic advice. The voices are sometimes VERY helpful. Other times they only want to see you suffer. Advantage against fear.",
  features: [
    {
      id: "haunted-past-cryptic-voices",
      name: "Cryptic Voices",
      description:
        "You are haunted by voices that occasionally give you cryptic advice. The voices are sometimes VERY helpful. Other times they only want to see you suffer.",
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "haunted-past-fearless-from-experience",
      name: "Fearless From Experience",
      description: "Advantage against fear.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
