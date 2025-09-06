import { SubclassDefinition } from "../../types/class";

export const songweaverHeraldCourage: SubclassDefinition = {
  id: "songweaver-herald-courage",
  name: "Herald of Courage",
  parentClassId: "songweaver",
  description:
    "A songweaver who inspires others to great deeds, bolstering allies and leading them to victory through inspiring presence.",
  features: [
    {
      id: "inspiring-presence",
      level: 3,
      name: "Inspiring Presence",
      description:
        "Whenever you use Songweaver's Inspiration, your allies within 12 spaces who can hear you gain WIL temp HP.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "unfailing-courage",
      level: 7,
      name: "Unfailing Courage",
      description:
        "Your presence inspires others to feats of heart and courage ahead of only in legend. Your Songweaver's Inspiration allows your target to roll with advantage.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "fire-in-my-bones",
      level: 11,
      name: "Fire in my Bones",
      description: "Your Songweaver's Inspiration also grants your target 1 additional action.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "chorus-of-champions",
      level: 15,
      name: "Chorus of Champions",
      description: "(1/encounter) Free Reaction: Give all party members 1 action.",
      effects: [
        {
          id: "chorus-of-champions-0",
          type: "ability",
          ability: {
            id: "chorus-of-champions",
            name: "Chorus of Champions",
            description: "Give all party members 1 action as a free reaction.",
            type: "action",
            frequency: "per_encounter",
            maxUses: { type: "fixed", value: 1 },
          },
        },
      ],
    },
  ],
};
