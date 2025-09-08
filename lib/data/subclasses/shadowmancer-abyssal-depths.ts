import { SubclassDefinition } from "../../schemas/class";

export const shadowmancerAbyssalDepths: SubclassDefinition = {
  id: "shadowmancer-abyssal-depths",
  name: "Pact of the Abyssal Depths",
  parentClassId: "shadowmancer",
  description:
    "A shadowmancer who has made a pact with entities from the frozen depths of the abyss, gaining mastery over ice and cold.",
  features: [
    {
      id: "master-of-nightfrost",
      level: 3,
      name: "Master of Nightfrost",
      description:
        "Your Patron grants you knowledge of Ice spells. Gain the ability to breathe underwater. Your shadow minions become beings of nightfrost. Your shadow blast and minions can deal cold or necrotic damage, and whenever they would crit, you gain INT+LVL temp HP.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "shadowfrost",
      level: 7,
      name: "Shadowfrost",
      description:
        "Your Shadow Blast also Slows. You can cast Cryosleep or Rimeblades without Pilfering Power by spending 10 temp HP. Choose 1 Ice Utility Spell.",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "glacial-resilience",
      level: 11,
      name: "Glacial Resilience",
      description:
        "(1/Safe Rest) Reaction (whenever you are attacked or would gain a condition), gain 10+LVL temp HP and end ALL negative conditions on yourself. At the end of your next turn, any remaining temp HP are lost.",
      effects: [
        {
          id: "glacial-resilience-0",
          type: "ability",
          ability: {
            id: "glacial-resilience",
            name: "Glacial Resilience",
            description:
              "Gain 10+LVL temp HP and end ALL negative conditions. Remaining temp HP lost at end of next turn.",
            type: "action",
            frequency: "per_safe_rest",
            maxUses: { type: "fixed", value: 1 },
          },
        },
      ],
    },
    {
      id: "cryomancer-s-reprisal",
      level: 15,
      name: "Cryomancer's Reprisal",
      description:
        "Pay half your max HP to cast ANY Ice spell. After casting an Ice spell in this way, you gain an invisible aura: the next creature that hits you with a melee attack this encounter takes cold damage equal to half the HP you spent on this casting.",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};
