import { BackgroundDefinition } from "../../schemas/background";

export const historyBuff: BackgroundDefinition = {
  id: "history-buff",
  name: "History Buff",
  description:
    "Advantage on all Lore checks related to knowledge about items, facts, or events that happened more than 100 years ago.",
  features: [
    {
      id: "history-buff-ancient-knowledge",
      name: "Ancient Knowledge",
      description:
        "Advantage on all Lore checks related to knowledge about items, facts, or events that happened more than 100 years ago.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
