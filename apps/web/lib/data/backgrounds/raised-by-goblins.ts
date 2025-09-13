import { BackgroundDefinition } from "../../schemas/background";

export const raisedByGoblins: BackgroundDefinition = {
  id: "raised-by-goblins",
  name: "Raised by Goblins",
  description:
    "You speak Goblin natively (much better than one who has learned it later in life). You automatically notice and can avoid crudely-made traps and have advantage to notice and disarm more sophisticated traps. Change It Up! You can choose any other ancestry to be raised by instead, and exchange the known language and get 1 helpful/iconic ability those people would inculcate (e.g., Dwarves know Dwarvish and are very good with smithing or stonecraft).",
  features: [
    {
      id: "raised-by-goblins-native-goblin-speaker",
      name: "Native Goblin Speaker",
      description:
        "You speak Goblin natively (much better than one who has learned it later in life).",
      traits: [], // Passive feature - no mechanical traits to process
    },
    {
      id: "raised-by-goblins-trap-sense",
      name: "Trap Sense",
      description:
        "You automatically notice and can avoid crudely-made traps and have advantage to notice and disarm more sophisticated traps.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
