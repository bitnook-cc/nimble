import { BackgroundDefinition } from "../../schemas/background";

export const feyTouched: BackgroundDefinition = {
  id: "fey-touched",
  name: "Fey Touched",
  description:
    "You take half damage from all magical traits, double from weapons made of metal (before armor is applied).",
  features: [
    {
      id: "fey-touched-fey-resilience",
      name: "Fey Resilience",
      description:
        "You take half damage from all magical traits, double from weapons made of metal (before armor is applied).",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
