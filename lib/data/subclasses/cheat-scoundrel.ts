import { SubclassDefinition, ClassFeature } from '../../types/class';

const scoundrelFeatures: ClassFeature[] = [
  // Level 3
  {
    id: 'scoundrel-low-blow',
    level: 3,
    type: 'ability',
    name: 'Low Blow',
    description: 'When you Sneak Attack, you may spend 2 additional actions to Incapacitate your target until the start of your next turn (STR save DC 10+INT). Save or fail, they are Taunted by you until you drop to 0 HP.',
    ability: {
      id: 'low-blow',
      name: 'Low Blow',
      description: 'When you Sneak Attack, you may spend 2 additional actions to Incapacitate your target until the start of your next turn (STR save DC 10+INT). Save or fail, they are Taunted by you until you drop to 0 HP.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 2
    }
  },
  {
    id: 'scoundrel-sweet-talk',
    level: 3,
    type: 'passive_feature',
    name: 'Sweet Talk',
    description: "You may gain advantage on all Influence checks with NPC's you've just met for the first time. This lasts until you fail an Influence check with them or until you meet a 2nd time. You have disadvantage on Influence checks with them after you use this ability (until you get back on good terms).",
    category: 'social'
  },
  // Level 7
  {
    id: 'scoundrel-pocket-sand',
    level: 7,
    type: 'ability',
    name: 'Pocket Sand',
    description: '(2/encounter-you\'ve got to collect more sand!) When you Defend against a melee attack, Blind the attacker until the start of their next turn and force them to reroll the attack (Blinded creatures attack with disadvantage).',
    ability: {
      id: 'pocket-sand',
      name: 'Pocket Sand',
      description: 'When you Defend against a melee attack, Blind the attacker until the start of their next turn and force them to reroll the attack (Blinded creatures attack with disadvantage).',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 2 }
    }
  },
  // Level 11
  {
    id: 'scoundrel-escape-plan',
    level: 11,
    type: 'ability',
    name: 'Escape Plan',
    description: '(1/Safe Rest) When you would drop to 0 HP or gain a Wound, you don\'t. Instead, you turn Invisible for 1 minute or until you attack.',
    ability: {
      id: 'escape-plan',
      name: 'Escape Plan',
      description: 'When you would drop to 0 HP or gain a Wound, you don\'t. Instead, you turn Invisible for 1 minute or until you attack.',
      type: 'action',
      frequency: 'per_safe_rest',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  // Level 15
  {
    id: 'scoundrel-heads-i-win-tails-you-lose',
    level: 15,
    type: 'ability',
    name: 'Heads I Win, Tails You Lose',
    description: '(1/encounter) Attacks you make this round don\'t miss, you crit on 1 less than normally needed, and you gain LVL temp HP.',
    ability: {
      id: 'heads-i-win-tails-you-lose',
      name: 'Heads I Win, Tails You Lose',
      description: 'Attacks you make this round don\'t miss, you crit on 1 less than normally needed, and you gain LVL temp HP.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 }
    }
  }
];

export const cheatScoundrel: SubclassDefinition = {
  id: 'tools-of-the-scoundrel',
  name: 'Tools of the Scoundrel',
  description: 'Cheats who embrace the path of the Scoundrel become masters of misdirection and dirty tricks. They fight without honor but with incredible effectiveness, always having an escape plan ready.',
  parentClassId: 'cheat',
  features: scoundrelFeatures
};