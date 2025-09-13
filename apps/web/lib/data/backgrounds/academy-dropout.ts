import { BackgroundDefinition } from "../../schemas/background";

export const academyDropout: BackgroundDefinition = {
  id: "academy-dropout",
  name: "Academy Dropout",
  description:
    "School just isn't for everyone! You learn by experience in the real world (or at least that's what you tell yourself). Learn any 1 Utility Spell.",
  features: [
    {
      id: "academy-dropout-street-smart-learning",
      name: "Street Smart Learning",
      description: "Learn any 1 Utility Spell of your choice.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
