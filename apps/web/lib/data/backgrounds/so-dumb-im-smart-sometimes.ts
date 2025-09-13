import { BackgroundDefinition } from "../../schemas/background";

export const soDumbImSmartSometimes: BackgroundDefinition = {
  id: "so-dumb-im-smart-sometimes",
  name: "So Dumb I'm Smart Sometimes",
  description:
    "(Req. 0 or negative INT at character creation.) Reroll an INT-related skill check, 1/day. Reroll a failed INT save with advantage, 1/Safe Rest.",
  features: [
    {
      id: "so-dumb-im-smart-sometimes-lucky-stupidity",
      name: "Lucky Stupidity",
      description:
        "Reroll an INT-related skill check, 1/day. Reroll a failed INT save with advantage, 1/Safe Rest.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
