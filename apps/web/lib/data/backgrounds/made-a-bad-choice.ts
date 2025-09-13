import { BackgroundDefinition } from "../../schemas/background";

export const madeABadChoice: BackgroundDefinition = {
  id: "made-a-bad-choice",
  name: "Made a BAD Choice",
  description:
    "Start with 500 or 1000 extra gold, or an uncommon/rare magical item (that your GM allows). Gain an equally powerful curse or enemy who wants it back. If you choose this background, your GM may allow you to choose another.",
  features: [
    {
      id: "made-a-bad-choice-ill-gotten-gains",
      name: "Ill-Gotten Gains",
      description:
        "Start with 500 or 1000 extra gold, or an uncommon/rare magical item (GM's choice). Gain an equally powerful curse or enemy who wants it back.",
      traits: [], // Passive feature - no mechanical traits to process
    },
  ],
};
