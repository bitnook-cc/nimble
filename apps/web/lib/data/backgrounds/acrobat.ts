import { BackgroundDefinition } from "../../schemas/background";

export const acrobat: BackgroundDefinition = {
  id: "acrobat",
  name: "Acrobat",
  description:
    "Can be thrown by a larger ally, REALLY far. Half damage from falling and forced movement.",
  features: [
    {
      id: "acrobat-acrobatic-training",
      name: "Acrobatic Training",
      description:
        "Can be thrown by a larger ally, REALLY far. Half damage from falling and forced movement.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
