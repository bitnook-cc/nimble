import { SubclassDefinition, ClassFeature } from '../../types/class';

const fangAndClawFeatures: ClassFeature[] = [
  // Level 3
  {
    id: 'swiftshift',
    level: 3,
    type: 'passive_feature',
    name: 'Swiftshift',
    description: 'When you roll Initiative, you may Beastshift or move for free. While transformed, you may shift between different Direbeast forms for free (and as a reaction by spending 1 mana); however, Beastshifting for free does not grant any temp HP.',
    category: 'combat'
  },
  {
    id: 'windborne-protector',
    level: 3,
    type: 'ability',
    name: 'Windborne Protector',
    description: '(1/encounter) Reaction: when an enemy attacks, spend 2 mana to shift into a Fearsome Beast. Then you may Interpose from up to 12 spaces away and Defend for free (if you have not yet done so this round).',
    ability: {
      id: 'windborne-protector',
      name: 'Windborne Protector',
      description: 'When an enemy attacks, spend 2 mana to shift into Fearsome Beast. Interpose from up to 12 spaces away and Defend for free.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'friend-of-beasts',
    level: 3,
    type: 'passive_feature',
    name: 'Friend of Beasts',
    description: 'Beasts will not attack you until you first harm them. You may transform into harmless beasts without spending a Beastshift charge.',
    category: 'exploration'
  },
  // Level 7
  {
    id: 'unleash-the-beast',
    level: 7,
    type: 'ability',
    name: 'Unleash the Beast',
    description: '(1/encounter) When you miss, you can crit instead.',
    ability: {
      id: 'unleash-the-beast',
      name: 'Unleash the Beast',
      description: 'When you miss, you can crit instead.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'storm-wake',
    level: 7,
    type: 'ability',
    name: 'Storm Wake',
    description: '(1/encounter) Action: Spend 3 mana to shift into a Beast of the Pack, then teleport in a straight line up to 12 spaces away, unerringly dealing WIL d8 lightning damage to any creatures adjacent to your path.',
    ability: {
      id: 'storm-wake',
      name: 'Storm Wake',
      description: 'Spend 3 mana to shift into Beast of the Pack, teleport up to 12 spaces in a straight line, dealing WIL d8 lightning damage to adjacent creatures.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 },
      actionCost: 1
    }
  },
  // Level 11
  {
    id: 'master-of-forms',
    level: 11,
    type: 'passive_feature',
    name: 'Master of Forms',
    description: 'Your shapeshift forms can have 2 Chimeric Boons at a time.',
    category: 'combat'
  },
  {
    id: 'venomous-gaze',
    level: 11,
    type: 'ability',
    name: 'Venomous Gaze',
    description: '(1/encounter) Action: Spend 2 mana to shift into a Beast of Nightmares. Then either poison a creature (if you move 2 × WIL spaces closer to you on a failed WIL save (they will with disadvantage and must repeat until they save or can move no further)). If they end up in the same space as you, you may Sting them for free.',
    ability: {
      id: 'venomous-gaze',
      name: 'Venomous Gaze',
      description: 'Spend 2 mana to shift into Beast of Nightmares. Force creature to move toward you on failed WIL save, then Sting for free if they reach you.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 },
      actionCost: 1
    }
  },
  // Level 15
  {
    id: 'master-of-forms-2',
    level: 15,
    type: 'passive_feature',
    name: 'Master of Forms (2)',
    description: 'You can Beastshift 2 additional times per Safe Rest. Choose 2 additional Chimeric Boons. Your Direbeast forms can have 3 at a time.',
    category: 'combat'
  }
];

export const circleOfFangAndClaw: SubclassDefinition = {
  id: 'circle-of-fang-and-claw',
  name: 'Circle of Fang & Claw',
  description: 'Stormshifters who focus on perfecting their shapeshifting abilities, becoming masters of beast forms and primal combat.',
  parentClassId: 'stormshifter',
  features: fangAndClawFeatures
};